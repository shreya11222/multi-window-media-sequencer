package main

import (
	"log"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/glebarez/sqlite"
	"gorm.io/gorm"

	"multi-window-media-sequencer/models"
	"multi-window-media-sequencer/routes"
	"multi-window-media-sequencer/services"
)

func main() {
	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "media_sequencer.db"
	}

	db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
	if err != nil {
		log.Fatal("database connection failed:", err)
	}

	if err := db.AutoMigrate(&models.Window{}, &models.Media{}, &models.PlaylistItem{}, &models.SyncState{}); err != nil {
		log.Fatal("migration failed:", err)
	}

	services.Seed(db)

	r := gin.Default()
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"*"}
	config.AllowMethods = []string{"GET", "POST", "DELETE", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Accept"}
	r.Use(cors.New(config))

	routes.Register(r, db)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Keep a small health timestamp useful for deployment diagnostics.
	_ = time.Now()

	log.Printf("Go backend running on :%s", port)
	log.Printf("Health check: http://localhost:%s/api/health", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}
