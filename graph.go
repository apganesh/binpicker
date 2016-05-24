package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"math"
	"math/rand"

	"golang.org/x/net/context"

	"googlemaps.github.io/maps"
)

const kmtomiles = float64(0.621371192)
const earthRadius = float64(6371)

type Edge struct {
	From     uint16
	To       uint16
	Distance float64
}

type Node struct {
	Id       int `json:"id"`
	LL       maps.LatLng
	Capacity int `json:"capacity"`
}

type Graph struct {
	Edges    []*Edge
	Vertices []*Node
}

type RouteResponse struct {
	Routes            []maps.Route            `json:"routes"`
	GeocodedWaypoints []maps.GeocodedWaypoint `json:"geocoded_waypoints"`
	Request           maps.DirectionsRequest  `json:"request"`
	Status            string                  `json:"status"`
}

// We make sure that the latlng have a valid address ... instead of showing some in a random place
func validAddress(ll *maps.LatLng) bool {

	r := &maps.GeocodingRequest{
		LatLng: ll,
	}

	resp, err := client.Geocode(context.Background(), r)

	if len(resp) == 0 {
		return false
	}

	if err != nil {
		return false
	}

	if resp[0].Geometry.LocationType == "ROOFTOP" {
		other := resp[0].Geometry.Location
		return math.Abs(ll.Lat-other.Lat) < 0.005 && math.Abs(ll.Lng-other.Lng) < 0.005
	}

	return false

}

func getRandomLocations(bounds maps.LatLngBounds, numbins int) []*Node {

	var locs []*Node

	sw := bounds.SouthWest
	ne := bounds.NorthEast

	lat_diff := ne.Lat - sw.Lat
	lng_diff := ne.Lng - sw.Lng

	id := 0

	for numbins > 0 {
		rLat := rand.Float64()*lat_diff + sw.Lat
		rLng := rand.Float64()*lng_diff + sw.Lng
		capacity := rand.Intn(100)
		ll := &maps.LatLng{Lat: rLat, Lng: rLng}
		if validAddress(ll) == true {
			x := &Node{Id: id, LL: *ll, Capacity: capacity}
			locs = append(locs, x)
			id++
			numbins--
		}
	}

	return locs

}

func check(err error) {
	if err != nil {
		log.Fatalf("fatal error: %s", err)
	}
}

// Read method for reading a json file with the information
func readGraph() *Graph {

	type Data struct {
		Lat      float64 `json:"lat"`
		Lng      float64 `json:"lng"`
		Capacity int     `json:"capacity"`
		Address  string  `json:"address"`
	}

	rawlocs, err := ioutil.ReadFile("./locs.json")

	if err != nil {
		fmt.Println(err)
	}

	var elems []Data

	json.Unmarshal(rawlocs, &elems)

	index := 0
	gr := &Graph{}

	for _, e := range elems {
		ln := e.Lat
		lt := e.Lng
		var x = &Node{Id: index, LL: maps.LatLng{Lat: ln, Lng: lt}, Capacity: e.Capacity}
		gr.Vertices = append(gr.Vertices, x)
		index++
	}
	return gr
}

func getRouteOrder(locs []maps.LatLng) []maps.LatLng {
	gr := &Graph{}

	index := 0
	for _, ll := range locs {
		var x = &Node{Id: index, LL: ll}
		gr.Vertices = append(gr.Vertices, x)
		index++
	}
	cost := gr.getCostMatrix()

	tour := gr.tsp_2opt(cost)
	var routes []maps.LatLng

	for i := 0; i < len(tour); i++ {
		routes = append(routes, gr.Vertices[tour[i]].LL)
	}
	return routes
}

func getTestRouteSegments() []RouteResponse {

	var routes []RouteResponse

	r := &maps.DirectionsRequest{
		Origin:      "Milpitas, CA",
		Destination: "San Jose, CA",
		Mode:        maps.TravelModeDriving,
	}

	resp, gway, err := client.Directions(context.Background(), r)
	if err != nil {
		return routes
	}

	x := RouteResponse{resp, gway, *r, "OK"}
	routes = append(routes, x)

	return routes
}

func getDistance(n1 *Node, n2 *Node) float64 {
	r := &maps.DirectionsRequest{
		Origin:      n1.LL.String(),
		Destination: n2.LL.String(),
		Mode:        maps.TravelModeDriving,
	}

	resp, _, err := client.Directions(context.Background(), r)
	if err != nil {
		fmt.Println(err.Error())
		return 1000.0
	}
	return ((float64)(resp[0].Legs[0].Distance.Meters) / (float64)(16000.0))
}

func getHaversineDistance(n1 *Node, n2 *Node) float64 {
	var latFrom = n1.LL.Lat
	var lonFrom = n1.LL.Lng
	var latTo = n2.LL.Lat
	var lonTo = n2.LL.Lng

	// From golang playground
	var deltaLat = (latTo - latFrom) * (math.Pi / 180)
	var deltaLon = (lonTo - lonFrom) * (math.Pi / 180)

	var a = math.Sin(deltaLat/2)*math.Sin(deltaLat/2) +
		math.Cos(latFrom*(math.Pi/180))*math.Cos(latTo*(math.Pi/180))*
			math.Sin(deltaLon/2)*math.Sin(deltaLon/2)
	var c = 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))

	distance := earthRadius * c
	distance = distance * kmtomiles
	return distance
}

func (gr *Graph) getCostMatrix() [][]float64 {
	n := (uint32)(len(gr.Vertices))

	cost := make([][]float64, n)

	var i, j uint32
	for i = 0; i < n; i++ {
		cost[i] = make([]float64, n)
	}

	for i = 0; i < n-1; i++ {
		for j = i + 1; j < n; j++ {
			if i == j {
				cost[i][j] = 0.0
				cost[j][i] = 0.0
			} else {
				cost[i][j] = getHaversineDistance(gr.Vertices[i], gr.Vertices[j])
				//cost[i][j] = getDistance(gr.Vertices[i], gr.Vertices[j])
				cost[j][i] = cost[i][j]
			}
		}
	}
	return cost
}

// This would provide exact solution -- but the complexity is really large
func (gr *Graph) findShortestTour(cost [][]float64) []uint32 {
	// Get the cost matrix for the graph
	// run the floyd algo on it
	// run the TSP on the cost matrix
	// retrieve the tour

	var n uint32

	n = (uint32)(len(gr.Vertices))

	nsub := (uint32)(1 << n)

	var k, i, j uint32
	// Find the optimal cost between two points from the cost matrix
	for k = 0; k < n; k++ {
		for i = 0; i < n; i++ {
			for j = 0; j < n; j++ {
				if i != j && i != k && j != k {
					cost[i][j] = math.Min(cost[i][k]+cost[k][j], cost[i][j])
				}
			}
		}
	}

	opt := make([][]float64, nsub)
	var ns uint32
	for ns = 0; ns < nsub; ns++ {
		opt[ns] = make([]float64, n)
	}

	fmt.Println("Started finding the optimal route")
	// Find the optimal values from starting from '0' and reaching a location with index 'i'
	var s uint32
	var u uint32
	for s = 0; s < nsub; s++ {
		for i = 1; i < n; i++ {
			var subset []uint32
			for u = 1; u < (uint32)(n); u++ {
				if s&(1<<u) != 0 {
					subset = append(subset, u)
				}
			}
			if len(subset) == 1 {
				opt[s][i] = cost[0][i]
			} else if len(subset) > 2 {
				minSubpath := math.MaxFloat64
				t := s &^ (1 << i)
				var j uint32
				for _, j = range subset {
					if j != i && opt[t][j]+cost[j][i] < minSubpath {
						minSubpath = opt[t][j] + cost[j][i]
						opt[s][i] = minSubpath
					}
				}
			}
		}
	}
	fmt.Println("Finished finding the optimal route")

	fmt.Println("Started constructing the tour")
	// Now that we have the optimal values we will recreate the tour
	var tour []uint32
	tour = append(tour, 0)
	selected := make([]bool, n)
	selected[0] = true
	s = nsub - 1
	for i = 0; i < n-1; i++ {
		j := tour[len(tour)-1]
		minSubpath := math.MaxFloat64
		var bestK uint32
		for k = 0; k < n; k++ {
			if !selected[k] && opt[s][k]+cost[k][j] < minSubpath {
				minSubpath = opt[s][k] + cost[k][j]
				bestK = k
			}
		}
		tour = append(tour, bestK)
		selected[bestK] = true
		s = s - (1 << bestK)
	}

	fmt.Println("Finished constructing the tour")
	tour = append(tour, 0)
	fmt.Println(tour)
	var totalCost float64

	for i = 1; i <= n; i++ {
		totalCost += cost[tour[i-1]][tour[i%n]]
	}

	fmt.Println("Total cost: ", totalCost)
	return tour
}
