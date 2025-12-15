package com.dartcounter.repository;

import com.dartcounter.entity.Player;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlayerRepository extends JpaRepository<Player, Long> {

    List<Player> findBySessionSessionCodeOrderByPlayerOrder(String sessionCode);
}
