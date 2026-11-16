package com.ganum.benefit;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface BenefitRepository extends JpaRepository<Benefit, String> {

	List<Benefit> findByDeadlineBetween(LocalDate from, LocalDate to);
}
