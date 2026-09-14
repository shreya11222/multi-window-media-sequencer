package models

import "time"

type Window struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"createdAt"`
}

type Media struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	Name      string    `json:"name"`
	Type      string    `json:"type"` // image | video
	URL       string    `json:"url"`
	Duration  int       `json:"duration"` // seconds
	CreatedAt time.Time `json:"createdAt"`
}

type PlaylistItem struct {
	ID        uint `json:"id" gorm:"primaryKey"`
	WindowID  uint `json:"windowId"`
	MediaID   uint `json:"mediaId"`
	Position  int  `json:"position"`
	Duration  int  `json:"duration"`
	Media     Media `json:"media" gorm:"foreignKey:MediaID"`
}

type SyncState struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	MediaID   uint      `json:"mediaId"`
	StartedAt time.Time `json:"startedAt"`
	Duration  int       `json:"duration"` // seconds
	Active    bool      `json:"active"`
	Media     Media     `json:"media" gorm:"foreignKey:MediaID"`
}
