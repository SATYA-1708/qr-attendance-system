package com.qrattendance.repository;

import com.qrattendance.model.Attendance;
import com.qrattendance.model.Session;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    boolean existsBySessionAndStudentUid(Session session, String studentUid);
    List<Attendance> findBySession(Session session);
}
