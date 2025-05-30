package services

import (
	"fmt"

	"github.com/Ghaby-X/tasork/internal/env"
	"gopkg.in/gomail.v2"
)

func SendMail(messageBody, Subject, userMail string) error {
	m := gomail.NewMessage()
	m.SetHeader("From", "gabrielanyaele12@gmail.com")
	m.SetHeader("To", userMail)
	m.SetHeader("Subject", Subject)
	m.SetBody("text/html", messageBody)

	appPass := env.GetString("APP_PASSWORD", "")
	appUser := env.GetString("APP_USER", "")
	d := gomail.NewDialer("smtp.gmail.com", 465, appUser, appPass)
	d.SSL = true

	if err := d.DialAndSend(m); err != nil {
		return fmt.Errorf("failed to send msg %v", err)
	}

	return nil
}

func SendWelcomeMail(email, customMessage string) error {
	if len(customMessage) > 1 {
		err := SendMail(
			"Welcome to tasork!",
			customMessage,
			email,
		)

		return err
	}

	err := SendMail(
		"Welcome to tasork!",
		"Welcome to tasork! tasork is an efficient task management system ready to help you micromanage ",
		email,
	)

	return err
}

func SendInvitationMail(email, tenantName, invitationURL string) error {
	message := fmt.Sprintf("You have been invited to join %s on tasork! click on the link below to accept invite. \n\n\n%s", tenantName, invitationURL)
	subject := fmt.Sprintf("Invitation to join %s", tenantName)
	err := SendMail(
		subject,
		message,
		email,
	)

	return err
}

// func SendAssignedTasksMail(email, customMessage string) error {

// }
