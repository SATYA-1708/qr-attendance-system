package com.qrattendance.controller;

import com.qrattendance.model.Attendance;
import com.qrattendance.model.Session;
import com.qrattendance.model.User;
import com.qrattendance.repository.AttendanceRepository;
import com.qrattendance.repository.SessionRepository;
import com.qrattendance.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/attendance")
@Transactional
public class AttendanceController {

    @Autowired
    private AttendanceRepository attendanceRepository;
    
    @Autowired
    private SessionRepository sessionRepository;
    
    @Autowired
    private UserRepository userRepository;

    // Admin endpoint to generate a new QR session
    @PostMapping("/generate-qr")
    public ResponseEntity<?> generateQr(@RequestBody Map<String, String> payload) {
        String email = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User admin = userRepository.findByEmail(email).orElse(null);
        if (admin == null) return ResponseEntity.status(401).body("Admin not found");

        Session session = new Session();
        session.setSessionToken(UUID.randomUUID().toString());
        session.setSubject(payload.get("subject"));
        session.setDate(payload.get("date"));
        session.setTimePeriod(payload.get("timePeriod"));
        session.setCreatedBy(admin);
        session.setActive(true);
        
        sessionRepository.save(session);
        return ResponseEntity.ok(session);
    }

    // Admin endpoint to stop attendance
    @PostMapping("/session/{token}/stop")
    public ResponseEntity<?> stopAttendance(@PathVariable String token) {
        Session session = sessionRepository.findBySessionToken(token).orElse(null);
        if (session == null) return ResponseEntity.notFound().build();
        
        session.setActive(false);
        sessionRepository.save(session);
        return ResponseEntity.ok("Attendance stopped");
    }

    // Public endpoint to get session details for students
    @GetMapping("/session/{token}")
    public ResponseEntity<?> getSession(@PathVariable String token, HttpServletRequest request) {
        System.out.println("[SCAN] Incoming request from IP: " + request.getRemoteAddr() + " for token: " + token);
        Session session = sessionRepository.findBySessionToken(token).orElse(null);
        
        if (session == null) {
            System.out.println("Session not found: " + token);
            return ResponseEntity.status(404).body("Invalid QR Code or session missing.");
        }
        
        if (!session.isActive()) {
            System.out.println("Session inactive: " + token);
            return ResponseEntity.status(403).body("Attendance is closed for this session.");
        }
        
        System.out.println("Found session: " + session.getSessionToken() + " | Active: " + session.isActive());
        User teacher = session.getCreatedBy();
        System.out.println("Teacher: " + (teacher != null ? teacher.getName() : "null"));

        return ResponseEntity.ok(Map.of(
            "subject", session.getSubject(),
            "date", session.getDate(),
            "timePeriod", session.getTimePeriod(),
            "teacherName", teacher != null ? teacher.getName() : "Unknown",
            "teacherEmpId", teacher != null ? teacher.getEmpId() : "N/A",
            "teacherImage", (teacher != null && teacher.getProfileImage() != null) ? teacher.getProfileImage() : ""
        ));
    }

    // Admin endpoint to view attendance history
    @GetMapping("/history")
    public ResponseEntity<?> getHistory() {
        String email = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User admin = userRepository.findByEmail(email).orElse(null);
        if (admin == null) return ResponseEntity.status(401).body("Admin not found");

        List<Session> sessions = sessionRepository.findByCreatedByOrderByCreatedAtDesc(admin);
        return ResponseEntity.ok(sessions);
    }

    // Public endpoint for students to mark attendance
    @PostMapping("/mark")
    public ResponseEntity<?> markAttendance(@RequestBody Map<String, String> payload, HttpServletRequest request) {
        String sessionToken = payload.get("sessionToken");
        String uid = payload.get("studentUid");
        String name = payload.get("studentName");
        System.out.println("[MARK] Request from IP: " + request.getRemoteAddr() + " | Student: " + name + " | Token: " + sessionToken);

        Session session = sessionRepository.findBySessionToken(sessionToken).orElse(null);
        if (session == null) {
            System.out.println("Mark failure: Session not found.");
            return ResponseEntity.status(404).body("Session not found");
        }
        
        if (!session.isActive()) {
            System.out.println("Mark failure: Session inactive.");
            return ResponseEntity.status(403).body("Attendance is closed");
        }

        if (attendanceRepository.existsBySessionAndStudentUid(session, uid)) {
            return ResponseEntity.badRequest().body("Attendance already recorded for this UID");
        }

        Attendance attendance = new Attendance();
        attendance.setSession(session);
        attendance.setStudentUid(uid);
        attendance.setStudentName(name);
        attendanceRepository.save(attendance);

        return ResponseEntity.ok("Attendance marked successfully");
    }

    // Admin endpoint to view records for a specific session
    @GetMapping("/records/{token}")
    public ResponseEntity<List<Attendance>> getRecords(@PathVariable String token) {
        Session session = sessionRepository.findBySessionToken(token).orElse(null);
        if (session == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(attendanceRepository.findBySession(session));
    }
}
