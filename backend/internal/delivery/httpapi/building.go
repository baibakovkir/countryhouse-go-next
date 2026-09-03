package httpapi

import (
	"net/http"

	"github.com/go-chi/chi/v5"

	"github.com/example/countryhouse/backend/internal/domain/building"
)

func (s *Server) getBuilding(w http.ResponseWriter, r *http.Request) {
	value, err := s.buildings.Get(r.Context(), currentUser(r).ID, chi.URLParam(r, "plotId"), chi.URLParam(r, "objectId"))
	if err != nil {
		s.writeError(w, err)
		return
	}
	s.writeJSON(w, http.StatusOK, value)
}

func (s *Server) saveBuilding(w http.ResponseWriter, r *http.Request) {
	var input building.Building
	if !s.decode(w, r, &input) {
		return
	}
	value, err := s.buildings.Save(r.Context(), currentUser(r).ID, chi.URLParam(r, "plotId"), chi.URLParam(r, "objectId"), input)
	if err != nil {
		s.writeError(w, err)
		return
	}
	s.writeJSON(w, http.StatusOK, value)
}

func (s *Server) addBuildingFloor(w http.ResponseWriter, r *http.Request) {
	var input building.Floor
	if !s.decode(w, r, &input) {
		return
	}
	value, err := s.buildings.AddFloor(r.Context(), currentUser(r).ID, chi.URLParam(r, "plotId"), chi.URLParam(r, "objectId"), input)
	if err != nil {
		s.writeError(w, err)
		return
	}
	s.writeJSON(w, http.StatusCreated, value)
}

func (s *Server) updateBuildingFloor(w http.ResponseWriter, r *http.Request) {
	var input building.Floor
	if !s.decode(w, r, &input) {
		return
	}
	input.ID = chi.URLParam(r, "floorId")
	value, err := s.buildings.UpdateFloor(r.Context(), currentUser(r).ID, chi.URLParam(r, "plotId"), chi.URLParam(r, "objectId"), input)
	if err != nil {
		s.writeError(w, err)
		return
	}
	s.writeJSON(w, http.StatusOK, value)
}

func (s *Server) deleteBuildingFloor(w http.ResponseWriter, r *http.Request) {
	if err := s.buildings.DeleteFloor(r.Context(), currentUser(r).ID, chi.URLParam(r, "plotId"), chi.URLParam(r, "objectId"), chi.URLParam(r, "floorId")); err != nil {
		s.writeError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (s *Server) addFloorElement(w http.ResponseWriter, r *http.Request) {
	var input building.Element
	if !s.decode(w, r, &input) {
		return
	}
	value, err := s.buildings.AddElement(r.Context(), currentUser(r).ID, chi.URLParam(r, "plotId"), chi.URLParam(r, "objectId"), chi.URLParam(r, "floorId"), input)
	if err != nil {
		s.writeError(w, err)
		return
	}
	s.writeJSON(w, http.StatusCreated, value)
}

func (s *Server) updateFloorElement(w http.ResponseWriter, r *http.Request) {
	var input building.Element
	if !s.decode(w, r, &input) {
		return
	}
	input.ID = chi.URLParam(r, "elementId")
	value, err := s.buildings.UpdateElement(r.Context(), currentUser(r).ID, chi.URLParam(r, "plotId"), chi.URLParam(r, "objectId"), chi.URLParam(r, "floorId"), input)
	if err != nil {
		s.writeError(w, err)
		return
	}
	s.writeJSON(w, http.StatusOK, value)
}

func (s *Server) deleteFloorElement(w http.ResponseWriter, r *http.Request) {
	if err := s.buildings.DeleteElement(r.Context(), currentUser(r).ID, chi.URLParam(r, "plotId"), chi.URLParam(r, "objectId"), chi.URLParam(r, "floorId"), chi.URLParam(r, "elementId")); err != nil {
		s.writeError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
