package com.example.runkk.crew;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** 크루 모임 일정 (ERD: crew_meetup) */
@Entity
@Table(name = "crew_meetup")
@Getter
@Setter
@NoArgsConstructor
public class CrewMeetup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long meetupId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "crew_id")
    private Crew crew;

    @Column(nullable = false)
    private LocalDateTime runAt;

    @Column(length = 100)
    private String meetingPlace;

    private Double meetingLat;

    private Double meetingLng;

    @Column(length = 500)
    private String description;
}
