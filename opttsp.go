package main

import "sort"

type Stack struct{ vec []uint16 }

func (s Stack) empty() bool    { return len(s.vec) == 0 }
func (s Stack) peek() uint16   { return s.vec[len(s.vec)-1] }
func (s Stack) len() int       { return len(s.vec) }
func (s *Stack) push(i uint16) { s.vec = append(s.vec, i) }
func (s *Stack) pop() uint16 {
	d := s.vec[len(s.vec)-1]
	s.vec = s.vec[:len(s.vec)-1]
	return d
}

type UF struct {
	parent []uint16
	rank   []uint16
	num    uint16
}

func NewUF(n uint16) *UF {
	uf := &UF{}
	uf.num = n
	uf.parent = make([]uint16, n)
	uf.rank = make([]uint16, n)
	var i uint16
	for i = 0; i < n; i++ {
		uf.parent[i] = i
		uf.rank[i] = 0
	}
	return uf
}

func (uf *UF) union(i, j uint16) {
	pi := uf.find(i)
	pj := uf.find(j)
	if pi == pj {
		return
	}

	if uf.rank[pi] > uf.rank[pj] {
		uf.parent[pj] = pi
		uf.rank[pi] += 1
	} else {
		uf.parent[pi] = pj
		uf.rank[pj] += 1
	}

}

func (uf *UF) find(i uint16) uint16 {
	if i != uf.parent[i] {
		uf.parent[i] = uf.find(uf.parent[i])
	}

	return uf.parent[i]
}

type Edges []*Edge

func (e Edges) Len() int           { return len(e) }
func (e Edges) Less(i, j int) bool { return e[i].Distance < e[j].Distance }
func (e Edges) Swap(i, j int)      { e[i], e[j] = e[j], e[i] }

// Kruskal's minimum spanning tree algorithm
// expects symmetric costs (i.e. an undirected graph)
func (gr *Graph) mst(cost [][]float64) []*Edge {
	var edges Edges

	n := (uint16)(len(gr.Vertices))

	// Find the costs
	var i, j uint16
	for i = 0; i < n-1; i++ {
		for j = i + 1; j < n; j++ {
			//dist := getDistance(gr.Vertices[i], gr.Vertices[j])
			e := &Edge{i, j, cost[i][j]}
			edges = append(edges, e)
		}
	}

	// sort the edges by Distance
	sort.Sort(edges)

	var msttree Edges
	uf := NewUF(n)
	var sz uint16
	i = 0
	sz = 0

	for i := 0; sz < n-1; i++ {
		u := edges[i].From
		v := edges[i].To
		if uf.find(u) != uf.find(v) {
			msttree = append(msttree, edges[i])
			uf.union(u, v)
			sz++
		}
	}
	return msttree
}

func (gr *Graph) tsp_2opt(cost [][]float64) []uint16 {

	mst_edges := gr.mst(cost)
	n := (uint16)(len(gr.Vertices))

	adjlist := make([][]uint16, n)

	var i uint16

	for i = 0; i < n-1; i++ {
		u := mst_edges[i].From
		v := mst_edges[i].To
		adjlist[u] = append(adjlist[u], v)
		adjlist[v] = append(adjlist[v], u)
	}

	var tour []uint16

	visited := make([]bool, n)
	var st Stack
	st.push(0)

	for (uint16)(len(tour)) < n {
		u := st.pop()
		if !visited[u] {
			tour = append(tour, u)
			visited[u] = true
			for _, v := range adjlist[u] {
				st.push(v)
			}
		}
	}
	tour = append(tour, 0)
	return tour
}
