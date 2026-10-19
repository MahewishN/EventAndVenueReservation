package com.slotlock.auth.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;

@Service
public class EmailService {

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    @Value("${sendgrid.api.key}")
    private String apiKey;

    @Value("${sendgrid.from.email}")
    private String senderEmail;

    public EmailService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
    }

    public void sendOtpEmail(String recipientEmail, String otp) {
        try {
            String emailText =
                    "Hello,\n\n"
                            + "Your OTP for SlotLock email verification is: "
                            + otp + "\n\n"
                            + "This OTP is valid for 15 minutes.\n"
                            + "Please do not share this code with anyone.\n\n"
                            + "If you did not request this verification, "
                            + "you can ignore this email.\n\n"
                            + "Regards,\nSlotLock Team";

            Map<String, Object> payload = Map.of(
                    "personalizations", List.of(
                            Map.of(
                                    "to", List.of(
                                            Map.of("email", recipientEmail)
                                    )
                            )
                    ),
                    "from", Map.of(
                            "email", senderEmail,
                            "name", "SlotLock Team"
                    ),
                    "subject", "SlotLock - Email Verification",
                    "content", List.of(
                            Map.of(
                                    "type", "text/plain",
                                    "value", emailText
                            )
                    )
            );

            String requestBody =
                    objectMapper.writeValueAsString(payload);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(
                            "https://api.sendgrid.com/v3/mail/send"
                    ))
                    .timeout(Duration.ofSeconds(10))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = httpClient.send(
                    request,
                    HttpResponse.BodyHandlers.ofString()
            );

            if (response.statusCode() < 200
                    || response.statusCode() >= 300) {
                throw new IllegalStateException(
                        "SendGrid rejected the email request. HTTP status: "
                                + response.statusCode()
                                + ". Response: "
                                + response.body()
                );
            }

        } catch (IOException ex) {
            throw new IllegalStateException(
                    "Failed to communicate with SendGrid.", ex
            );
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException(
                    "SendGrid email request was interrupted.", ex
            );
        }
    }
}
