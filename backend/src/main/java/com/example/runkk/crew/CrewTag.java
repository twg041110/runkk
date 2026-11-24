package com.example.runkk.crew;

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

/** 크루 태그 (ERD: crew_tag). 예: 초보환영, 저녁런 */
@Entity
@Table(name = "crew_tag")
@Getter
@Setter
@NoArgsConstructor
public class CrewTag {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long tagId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "crew_id")
    private Crew crew;

    @Column(nullable = false, length = 20)
    private String tagName;

    public CrewTag(Crew crew, String tagName) {
        this.crew = crew;
        this.tagName = tagName;
    }
}
