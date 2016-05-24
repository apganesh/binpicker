package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"strconv"
	"strings"

	"googlemaps.github.io/maps"

	"github.com/gorilla/mux"
)

func ErrorHandler(rw http.ResponseWriter, req *http.Request) {
	body, _ := ioutil.ReadFile("errors/index.html")
	fmt.Fprint(rw, string(body))
}

func LocationHandler(rw http.ResponseWriter, req *http.Request) {
	vars := mux.Vars(req)
	fmt.Println(req.URL.String())

	numbins := vars["bins"]

	sll, err := maps.ParseLatLng(vars["sw"])
	nll, err := maps.ParseLatLng(vars["ne"])
	if err != nil {
		panic(err)
	}

	bounds := maps.LatLngBounds{NorthEast: nll, SouthWest: sll}

	bins, _ := strconv.Atoi(numbins)
	fmt.Println("Finding the locs for bins: ", bins)
	locs := getRandomLocations(bounds, bins)

	json.NewEncoder(rw).Encode(locs)
}

func RouteHandler(rw http.ResponseWriter, req *http.Request) {
	vars := mux.Vars(req)

	binlocs := vars["locs"]

	binlocs = strings.Replace(binlocs, "%7C", "|", -1)
	locs, _ := maps.ParseLatLngList(binlocs)

	routes := getRouteOrder(locs)
	//routes := getRouteSegments(locs)
	json.NewEncoder(rw).Encode(routes)
}
