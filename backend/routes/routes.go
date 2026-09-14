package routes

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"multi-window-media-sequencer/models"
)

type Server struct {
	DB *gorm.DB
}

func Register(r *gin.Engine, db *gorm.DB) {
	s := &Server{DB: db}

	api := r.Group("/api")
	{
		api.GET("/health", s.health)
		api.GET("/windows", s.getWindows)
		api.GET("/windows/:id/playlist", s.getPlaylist)
		api.GET("/media", s.getMedia)
		api.POST("/windows/:id/media", s.addMedia)
		api.DELETE("/windows/:id/media/:mediaId", s.deleteMedia)
		api.POST("/sync", s.syncMedia)
		api.GET("/sync", s.getSync)
	}
}

func (s *Server) health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "ok", "time": time.Now().UTC()})
}

func (s *Server) getWindows(c *gin.Context) {
	var windows []models.Window
	if err := s.DB.Order("id asc").Find(&windows).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, windows)
}

func (s *Server) getPlaylist(c *gin.Context) {
	var items []models.PlaylistItem
	if err := s.DB.Preload("Media").
		Where("window_id = ?", c.Param("id")).
		Order("position asc, id asc").
		Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, items)
}

func (s *Server) getMedia(c *gin.Context) {
	var media []models.Media
	if err := s.DB.Order("id asc").Find(&media).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, media)
}

type addMediaRequest struct {
	MediaID  uint `json:"mediaId" binding:"required"`
	Duration int  `json:"duration"`
}

func (s *Server) addMedia(c *gin.Context) {
	var req addMediaRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "mediaId is required"})
		return
	}

	var media models.Media
	if err := s.DB.First(&media, req.MediaID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "media not found"})
		return
	}

	var maxPos int
	s.DB.Model(&models.PlaylistItem{}).
		Where("window_id = ?", c.Param("id")).
		Select("COALESCE(MAX(position), -1)").
		Scan(&maxPos)

	duration := req.Duration
	if duration <= 0 {
		duration = media.Duration
	}

	item := models.PlaylistItem{
		WindowID: parseUint(c.Param("id")),
		MediaID:  media.ID,
		Position: maxPos + 1,
		Duration: duration,
	}

	if err := s.DB.Create(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	s.DB.Preload("Media").First(&item, item.ID)
	c.JSON(http.StatusCreated, item)
}

func (s *Server) deleteMedia(c *gin.Context) {
	result := s.DB.Where("window_id = ? AND media_id = ?", c.Param("id"), c.Param("mediaId")).
		Delete(&models.PlaylistItem{})
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"deleted": result.RowsAffected})
}

type syncRequest struct {
	MediaID uint `json:"mediaId" binding:"required"`
}

func (s *Server) syncMedia(c *gin.Context) {
	var req syncRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "mediaId is required"})
		return
	}

	var media models.Media
	if err := s.DB.First(&media, req.MediaID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "media not found"})
		return
	}

	// A sync is a shared, server-timestamped event. Clients calculate elapsed
	// time from StartedAt so every window converges on the same playback position.
	state := models.SyncState{
		ID:        1,
		MediaID:   media.ID,
		StartedAt: time.Now().UTC(),
		Duration:  media.Duration,
		Active:    true,
	}
	if err := s.DB.Save(&state).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, state)
}

func (s *Server) getSync(c *gin.Context) {
	var state models.SyncState
	if err := s.DB.Preload("Media").First(&state, 1).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusOK, gin.H{"active": false})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if state.Active && time.Since(state.StartedAt) >= time.Duration(state.Duration)*time.Second {
		state.Active = false
		s.DB.Save(&state)
	}

	c.JSON(http.StatusOK, state)
}

func parseUint(s string) uint {
	var n uint
	for _, ch := range s {
		if ch >= '0' && ch <= '9' {
			n = n*10 + uint(ch-'0')
		}
	}
	return n
}
