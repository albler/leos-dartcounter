package com.dartcounter.repository;

import com.dartcounter.entity.ThrowHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ThrowHistoryRepository extends JpaRepository<ThrowHistory, Long> {

    List<ThrowHistory> findBySessionSessionCodeOrderByIdDesc(String sessionCode);

    Optional<ThrowHistory> findFirstBySessionSessionCodeOrderByIdDesc(String sessionCode);

    void deleteBySessionSessionCode(String sessionCode);
}
