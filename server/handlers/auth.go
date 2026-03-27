package handlers

import (
	"net/http"

	"wombocombo-backend/db"
	mw "wombocombo-backend/middleware"

	"github.com/labstack/echo/v4"
	"golang.org/x/crypto/bcrypt"
)

type registerReq struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type loginReq struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type userResp struct {
	ID          int    `json:"id"`
	Username    string `json:"username"`
	Email       string `json:"email"`
	DisplayName string `json:"display_name"`
	CreatedAt   string `json:"created_at"`
}

func Register(c echo.Context) error {
	var req registerReq
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Invalid body"})
	}

	if req.Username == "" || req.Email == "" || req.Password == "" {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "username, email and password required"})
	}

	if len(req.Password) < 4 {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Password must be at least 4 characters"})
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "Server error"})
	}

	var user userResp
	err = db.DB.QueryRow(
		`INSERT INTO users (username, email, password_hash, display_name)
		 VALUES ($1, $2, $3, $1)
		 RETURNING id, username, email, display_name, created_at`,
		req.Username, req.Email, string(hash),
	).Scan(&user.ID, &user.Username, &user.Email, &user.DisplayName, &user.CreatedAt)

	if err != nil {
		if isDuplicateKey(err) {
			return c.JSON(http.StatusConflict, echo.Map{"error": "Username or email already exists"})
		}
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "Server error"})
	}

	token, _ := mw.GenerateToken(user.ID, user.Username)
	return c.JSON(http.StatusCreated, echo.Map{"token": token, "user": user})
}

func Login(c echo.Context) error {
	var req loginReq
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Invalid body"})
	}

	if req.Email == "" || req.Password == "" {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "email and password required"})
	}

	var id int
	var username, email, displayName, passwordHash string
	err := db.DB.QueryRow(
		"SELECT id, username, email, display_name, password_hash FROM users WHERE email = $1",
		req.Email,
	).Scan(&id, &username, &email, &displayName, &passwordHash)

	if err != nil {
		return c.JSON(http.StatusUnauthorized, echo.Map{"error": "Invalid credentials"})
	}

	if bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(req.Password)) != nil {
		return c.JSON(http.StatusUnauthorized, echo.Map{"error": "Invalid credentials"})
	}

	token, _ := mw.GenerateToken(id, username)
	return c.JSON(http.StatusOK, echo.Map{
		"token": token,
		"user": userResp{
			ID:          id,
			Username:    username,
			Email:       email,
			DisplayName: displayName,
		},
	})
}

func Me(c echo.Context) error {
	userID := c.Get("user_id").(int)

	var user userResp
	err := db.DB.QueryRow(
		"SELECT id, username, email, display_name, created_at FROM users WHERE id = $1",
		userID,
	).Scan(&user.ID, &user.Username, &user.Email, &user.DisplayName, &user.CreatedAt)

	if err != nil {
		return c.JSON(http.StatusNotFound, echo.Map{"error": "User not found"})
	}

	return c.JSON(http.StatusOK, echo.Map{"user": user})
}

func isDuplicateKey(err error) bool {
	return err != nil && len(err.Error()) > 5 && err.Error()[:5] == "pq: d"
}
