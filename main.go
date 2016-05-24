package main

import (
	"fmt"
	"math/rand"
	"net/http"
	"os"
	"time"

	"googlemaps.github.io/maps"

	"github.com/gorilla/mux"
)

// Json file for the maps data
var (
	client *maps.Client
	apiKey = "AIzaSyCq8Kt3wHj7XgPw0el_gnzfjJtI-YsnUYo"
)

func main() {
	r := mux.NewRouter()
	rand.Seed(time.Now().UnixNano())

	var err error

	client, err = maps.NewClient(maps.WithAPIKey(apiKey), maps.WithRateLimit(8))
	if err != nil {
		panic(err)
	}

	r.HandleFunc("/getLocations/{bins}/{sw}/{ne}", LocationHandler)
	r.HandleFunc("/getRoute/{locs}", RouteHandler)

	r.PathPrefix("/").Handler(http.StripPrefix("/", http.FileServer(http.Dir("html/"))))

	http.Handle("/", r)

	var port = os.Getenv("PORT")
	if port == "" {
		port = "4747"
	}
	fmt.Println("Listening on port ", port)
	err = http.ListenAndServe(":"+port, nil)
	if err != nil {
		panic(err)
	}
}
