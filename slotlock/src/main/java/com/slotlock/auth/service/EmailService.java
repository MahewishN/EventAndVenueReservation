package com.slotlock.auth.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {
    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String senderEmail;

    public EmailService(JavaMailSender mailSender)
    {
        this.mailSender = mailSender;
    }

    public void sendOtpEmail(String recipientEmail, String otp)
    {
        SimpleMailMessage message = new SimpleMailMessage();

        message.setFrom(senderEmail);
        message.setTo(recipientEmail);
        message.setSubject("SlotLock - Email Verification");

        message.setText(
                "Hello,\n\n" +
                        "Your OTP for SlotLock email verification is: " + otp + "\n\n" +
                        "This OTP is valid for 15 minutes.\n" +
                        "Please do not share this code with anyone.\n\n" +
                        "If you did not request this verification, you can ignore this email.\n\n" +
                        "Regards,\n" +
                        "SlotLock Team"
        );

        mailSender.send(message);
    }
}
