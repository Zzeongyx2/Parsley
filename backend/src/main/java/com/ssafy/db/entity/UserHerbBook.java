package com.ssafy.db.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import lombok.Getter;
import lombok.Setter;

import javax.persistence.*;
import java.time.LocalDateTime;

/**
 * 유저-허브 도감 관계 엔티티
 */
@Getter
@Setter
@Entity
public class UserHerbBook {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_herb_book_id")
    private Long id;

    private LocalDateTime obtainedDate;

    @JsonBackReference
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "herb_book_id")
    private HerbBook herbBook;

    public UserHerbBook() {

    }
}
