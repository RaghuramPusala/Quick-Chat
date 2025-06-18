package main

import (
	"bytes"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"
)

type TranslationRequest struct {
	Q      string `json:"q"`
	Source string `json:"source"`
	Target string `json:"target"`
	Format string `json:"format"`
}

type TranslationResponse struct {
	TranslatedText string `json:"translatedText"`
}

func translateHandler(w http.ResponseWriter, r *http.Request) {
	// Allow CORS
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Token, token")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req TranslationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Println("❌ Invalid JSON:", err)
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	log.Printf("🔄 Incoming translation: q=%s | source=%s | target=%s", req.Q, req.Source, req.Target)

	if req.Q == "" {
		http.Error(w, "Missing 'q' parameter", http.StatusBadRequest)
		return
	}

	log.Printf("➡️ Translating: %q from %s to %s", req.Q, req.Source, req.Target)

	// Marshal request
	payloadBytes, _ := json.Marshal(req)
	bodyReader := bytes.NewReader(payloadBytes)

	// Primary and fallback URLs
	primaryURL := os.Getenv("TRANSLATE_API_URL")
	if primaryURL == "" {
		primaryURL = "https://translate.argosopentech.com/translate"
	}
	fallbackURL := "https://libretranslate.de/translate"

	// Try primary first
	resp, err := http.Post(primaryURL, "application/json", bodyReader)
	if err != nil {
		log.Printf("❌ Primary failed (%s): %v", primaryURL, err)
		log.Println("🔁 Retrying with fallback LibreTranslate.de...")

		// Retry with fallback
		bodyReader.Seek(0, io.SeekStart) // rewind reader
		resp, err = http.Post(fallbackURL, "application/json", bodyReader)
		if err != nil {
			log.Printf("❌ Fallback also failed: %v", err)
			http.Error(w, "Translation service failed", http.StatusInternalServerError)
			return
		}
	}
