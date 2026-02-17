package com.qrattendance.controller;

import com.qrattendance.model.User;
import com.qrattendance.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<?> getProfile() {
        String email = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) return ResponseEntity.status(401).body("User not found");
        
        return ResponseEntity.ok(Map.of(
            "name", user.getName() != null ? user.getName() : "",
            "email", user.getEmail(),
            "empId", user.getEmpId() != null ? user.getEmpId() : "",
            "profileImage", user.getProfileImage() != null ? user.getProfileImage() : ""
        ));
    }

    @PutMapping
    public ResponseEntity<?> updateProfile(@RequestBody Map<String, String> payload) {
        String email = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) return ResponseEntity.status(401).body("User not found");

        if (payload.containsKey("name")) user.setName(payload.get("name"));
        if (payload.containsKey("empId")) user.setEmpId(payload.get("empId"));
        if (payload.containsKey("profileImage")) user.setProfileImage(payload.get("profileImage"));

        userRepository.save(user);
        return ResponseEntity.ok("Profile updated successfully");
    }
}
