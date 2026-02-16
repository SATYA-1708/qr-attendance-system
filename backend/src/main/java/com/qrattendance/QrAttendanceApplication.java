package com.qrattendance;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
@RestController
public class QrAttendanceApplication {

    public static void main(String[] args) {
        SpringApplication.run(QrAttendanceApplication.class, args);
    }

    @GetMapping("/api/health")
    public String healthCheck() {
        return "QR Attendance Backend API is running successfully!";
    }
}
