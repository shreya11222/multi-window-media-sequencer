package services

import (
	"log"

	"gorm.io/gorm"
	"multi-window-media-sequencer/models"
)

func Seed(db *gorm.DB) {
	var count int64
	db.Model(&models.Window{}).Count(&count)
	if count > 0 {
		return
	}

	// Public demo media URLs keep the repository small. Replace them with your own
	// hosted files or upload/storage URLs for production.
	media := []models.Media{
		{Name: "Mountain Image", Type: "image", URL: "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1600&q=80", Duration: 12},
		{Name: "Ocean Image", Type: "image", URL: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80", Duration: 10},
		{Name: "Forest Image", Type: "image", URL: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1600&q=80", Duration: 11},
		{Name: "Big Buck Bunny", Type: "video", URL: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4", Duration: 15},
      {Name: "Sintel", Type: "video", URL: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4", Duration: 15},
      {Name: "Demo Video", Type: "video", URL: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4", Duration: 15},
	}

	for i := range media {
		if err := db.Create(&media[i]).Error; err != nil {
			log.Println("seed media:", err)
		}
	}

	windows := []models.Window{
		{Name: "Window 1"},
		{Name: "Window 2"},
		{Name: "Window 3"},
		{Name: "Window 4"},
	}

	for i := range windows {
		if err := db.Create(&windows[i]).Error; err != nil {
			log.Println("seed window:", err)
		}
	}

	playlists := [][]uint{
		{1, 4, 2},
		{4, 3, 5},
		{2, 6, 1},
		{3, 5, 4},
	}

	for wi, ids := range playlists {
		for pos, mediaID := range ids {
			var m models.Media
			if db.First(&m, mediaID).Error != nil {
				continue
			}
			item := models.PlaylistItem{
				WindowID: windows[wi].ID,
				MediaID:  mediaID,
				Position: pos,
				Duration: m.Duration,
			}
			if err := db.Create(&item).Error; err != nil {
				log.Println("seed playlist:", err)
			}
		}
	}
}
