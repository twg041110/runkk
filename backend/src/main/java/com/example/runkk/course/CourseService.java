package com.example.runkk.course;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.runkk.common.ApiException;
import com.example.runkk.common.PageResponse;
import com.example.runkk.course.CourseRepositories.CourseFeatureRepository;
import com.example.runkk.course.CourseRepositories.CourseRepository;
import com.example.runkk.course.CourseRepositories.CourseReviewRepository;
import com.example.runkk.course.CourseRepositories.SavedCourseRepository;
import com.example.runkk.member.Member;
import com.example.runkk.member.MemberDto;
import com.example.runkk.member.MemberService;
import com.example.runkk.run.RunRepositories.RunRecordRepository;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Service
@Transactional(readOnly = true)
public class CourseService {

    private final CourseRepository courses;
    private final CourseFeatureRepository features;
    private final CourseReviewRepository reviews;
    private final SavedCourseRepository saved;
    private final RunRecordRepository runs;
    private final MemberService memberService;

    public CourseService(CourseRepository courses, CourseFeatureRepository features, CourseReviewRepository reviews,
            SavedCourseRepository saved, RunRecordRepository runs, MemberService memberService) {
        this.courses = courses;
        this.features = features;
        this.reviews = reviews;
        this.saved = saved;
        this.runs = runs;
        this.memberService = memberService;
    }

    public record Feature(String type, String name) {
    }

    /** 목록 카드에 쓰는 코스 정보 */
    public record Summary(Long courseId, String name, String region, String startPlace, Double startLat,
            Double startLng, Member.Level difficulty, BigDecimal distanceKm, Integer expectedMinutes,
            Integer elevationM, boolean loop, List<Feature> features, double avgRating, long reviewCount,
            long weeklyRunners, boolean saved) {
    }

    public record Detail(Long courseId, String name, String description, String region, String startPlace,
            Double startLat, Double startLng, Member.Level difficulty, BigDecimal distanceKm, Integer expectedMinutes,
            Integer elevationM, boolean loop, String beginnerTip, String routeData, String recommendedMonth,
            List<Feature> features, double avgRating, long reviewCount, long weeklyRunners, boolean saved) {
    }

    public record Review(Long reviewId, MemberDto.Simple member, int rating, String content, LocalDateTime createdAt,
            boolean mine) {
    }

    public record ReviewRequest(
            @NotNull(message = "별점을 골라 주세요.") @Min(value = 1, message = "별점은 1~5점이에요.") @Max(value = 5, message = "별점은 1~5점이에요.") Integer rating,
            @Size(max = 1000, message = "후기는 1000자까지 쓸 수 있어요.") String content) {
    }

    public PageResponse<Summary> list(Long me, String region, Member.Level difficulty, BigDecimal maxKm,
            String keyword, int page, int size) {
        Page<Course> result = courses.search(blankToNull(region), difficulty, maxKm, blankToNull(keyword),
                PageRequest.of(page, size));
        Stats stats = stats(me, result.getContent().stream().map(Course::getCourseId).toList());
        return PageResponse.of(result, c -> toSummary(c, stats));
    }

    public Detail detail(Long me, Long courseId) {
        Course c = get(courseId);
        Stats s = stats(me, List.of(courseId));
        return new Detail(c.getCourseId(), c.getName(), c.getDescription(), c.getRegion(), c.getStartPlace(),
                c.getStartLat(), c.getStartLng(), c.getDifficulty(), c.getDistanceKm(), c.getExpectedMinutes(),
                c.getElevationM(), c.isLoop(), c.getBeginnerTip(), c.getRouteData(), c.getRecommendedMonth(),
                s.features(courseId), s.avg(courseId), s.count(courseId), s.runners(courseId), s.saved(courseId));
    }

    public PageResponse<Review> reviews(Long me, Long courseId, int page, int size) {
        get(courseId);
        return PageResponse.of(reviews.findByCourse(courseId, PageRequest.of(page, size)), r -> toReview(r, me));
    }

    @Transactional
    public Review addReview(Long me, Long courseId, ReviewRequest req) {
        Member member = memberService.getActive(me);
        CourseReview r = new CourseReview();
        r.setCourse(get(courseId));
        r.setMember(member);
        r.setRating(req.rating());
        r.setContent(req.content() == null ? null : req.content().trim());
        reviews.save(r);
        return toReview(r, me);
    }

    @Transactional
    public void deleteReview(Long me, Long reviewId) {
        CourseReview r = reviews.findById(reviewId).orElseThrow(() -> ApiException.notFound("후기를 찾을 수 없어요."));
        if (!r.getMember().getMemberId().equals(me)) {
            throw ApiException.forbidden("내가 쓴 후기만 지울 수 있어요.");
        }
        reviews.delete(r);
    }

    @Transactional
    public void save(Long me, Long courseId) {
        Member member = memberService.getActive(me);
        Course course = get(courseId);
        if (saved.findByMemberMemberIdAndCourseCourseId(me, courseId).isEmpty()) {
            saved.save(new SavedCourse(member, course));
        }
    }

    @Transactional
    public void unsave(Long me, Long courseId) {
        saved.deleteMine(me, courseId);
    }

    public PageResponse<Summary> savedCourses(Long me, int page, int size) {
        Page<SavedCourse> result = saved.findMine(me, PageRequest.of(page, size));
        Stats stats = stats(me, result.getContent().stream().map(s -> s.getCourse().getCourseId()).toList());
        return PageResponse.of(result, s -> toSummary(s.getCourse(), stats));
    }

    public Course get(Long courseId) {
        return courses.findById(courseId).orElseThrow(() -> ApiException.notFound("코스를 찾을 수 없어요."));
    }

    // ---- 목록 한 번에 필요한 숫자(별점, 후기 수, 이번 주 러너, 저장 여부)를 모아서 계산 ----

    private record Stats(Map<Long, List<Feature>> featureMap, Map<Long, Object[]> reviewMap,
            Map<Long, Long> runnerMap, Set<Long> savedSet) {

        List<Feature> features(Long id) {
            return featureMap.getOrDefault(id, List.of());
        }

        double avg(Long id) {
            Object[] row = reviewMap.get(id);
            if (row == null || row[1] == null) {
                return 0;
            }
            return BigDecimal.valueOf(((Number) row[1]).doubleValue()).setScale(1, RoundingMode.HALF_UP)
                    .doubleValue();
        }

        long count(Long id) {
            Object[] row = reviewMap.get(id);
            return row == null ? 0 : ((Number) row[2]).longValue();
        }

        long runners(Long id) {
            return runnerMap.getOrDefault(id, 0L);
        }

        boolean saved(Long id) {
            return savedSet.contains(id);
        }
    }

    private Stats stats(Long me, List<Long> ids) {
        if (ids.isEmpty()) {
            return new Stats(Map.of(), Map.of(), Map.of(), Set.of());
        }
        Map<Long, List<Feature>> featureMap = features.findByCourseCourseIdIn(ids).stream()
                .collect(Collectors.groupingBy(f -> f.getCourse().getCourseId(),
                        Collectors.mapping(f -> new Feature(f.getFeatureType(), f.getFeatureName()),
                                Collectors.toList())));
        Map<Long, Object[]> reviewMap = new HashMap<>();
        reviews.stats(ids).forEach(row -> reviewMap.put((Long) row[0], row));
        LocalDateTime weekStart = LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
                .atStartOfDay();
        Map<Long, Long> runnerMap = new HashMap<>();
        runs.runnersByCourses(ids, weekStart).forEach(row -> runnerMap.put((Long) row[0], (Long) row[1]));
        Set<Long> savedSet = me == null ? Set.of() : new HashSet<>(saved.savedIds(me, ids));
        return new Stats(featureMap, reviewMap, runnerMap, savedSet);
    }

    private static Summary toSummary(Course c, Stats s) {
        Long id = c.getCourseId();
        return new Summary(id, c.getName(), c.getRegion(), c.getStartPlace(), c.getStartLat(), c.getStartLng(),
                c.getDifficulty(), c.getDistanceKm(), c.getExpectedMinutes(), c.getElevationM(), c.isLoop(),
                s.features(id), s.avg(id), s.count(id), s.runners(id), s.saved(id));
    }

    private static Review toReview(CourseReview r, Long me) {
        return new Review(r.getReviewId(), MemberDto.Simple.of(r.getMember()), r.getRating(), r.getContent(),
                r.getCreatedAt(), r.getMember().getMemberId().equals(me));
    }

    static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
