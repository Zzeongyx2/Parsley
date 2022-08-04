package com.ssafy.db.entity;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import javax.persistence.*;
import java.util.ArrayList;
import java.util.List;

/**
 * 방 Entity
 */
@Getter
@Setter
@Entity
@ToString
public class Room {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "room_id")
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id")
    private User hostUser;

    @ManyToMany(mappedBy = "joinRooms", fetch = FetchType.EAGER)
    private List<User> members = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    private Mode mode;

    private String name;
    private String imageUrl;
    private String description;
    private int maxPopulation;
    private boolean isPublic;
    private String password;

    public Room() {

    }
}