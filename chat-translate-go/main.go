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
	// ✅ Allow CORS
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
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if req.Q == "" {
		http.Error(w, "Missing 'q' parameter", http.StatusBadRequest)
		return
	}

	payloadBytes, _ := json.Marshal(req)
	bodyReader := bytes.NewReader(payloadBytes)

	resp, err := http.Post("http://localhost:5001/translate", "application/json", bodyReader)
	if err != nil {
		log.Printf("Error contacting LibreTranslate: %v", err)
		http.Error(w, "Translation service error", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		body, _ := io.ReadAll(resp.Body)
		log.Printf("LibreTranslate returned status %d: %s", resp.StatusCode, body)
		http.Error(w, "Translation failed", http.StatusInternalServerError)
		return
	}

	var res TranslationResponse
	err = json.NewDecoder(resp.Body).Decode(&res)
	if err != nil {
		http.Error(w, "Failed to parse translation", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(res)
}

func main() {
	// ✅ Use PORT from environment or fallback to 8080
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	http.HandleFunc("/translate", translateHandler)

	log.Printf("✅ Translation server running on port %s", port)
	err := http.ListenAndServe(":"+port, nil)
	if err != nil {
		log.Fatal("❌ Server failed to start:", err)
	}
}
