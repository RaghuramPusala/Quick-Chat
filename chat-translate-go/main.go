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
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}
	if req.Q == "" {
		http.Error(w, "Missing 'q' parameter", http.StatusBadRequest)
		return
	}

	payloadBytes, _ := json.Marshal(req)
	bodyReader := bytes.NewReader(payloadBytes)

	// ✅ Use public LibreTranslate for Render
	translateURL := os.Getenv("TRANSLATE_API_URL")
	if translateURL == "" {
		translateURL = "https://translate.argosopentech.com/translate"
	}

	resp, err := http.Post(translateURL, "application/json", bodyReader)
	if err != nil {
		log.Printf("Error contacting LibreTranslate: %v", err)
		http.Error(w, "Translation service error", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		log.Printf("LibreTranslate returned %d: %s", resp.StatusCode, body)
		http.Error(w, "Translation failed", http.StatusInternalServerError)
		return
	}

	var res TranslationResponse
	if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
		http.Error(w, "Failed to parse translation", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(res)
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	http.HandleFunc("/translate", translateHandler)

	log.Printf("✅ Translation server running on port %s", port)
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatal("❌ Server failed:", err)
	}
}
