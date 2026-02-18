package com.qrattendance.repository;

import com.qrattendance.model.Session;
import com.qrattendance.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface SessionRepository extends JpaRepository<Session, Long> {
    Optional<Session> findBySessionToken(String sessionToken);
    List<Session> findByCreatedByOrderByCreatedAtDesc(User user);
}
