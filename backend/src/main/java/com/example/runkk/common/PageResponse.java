package com.example.runkk.common;

import java.util.List;
import java.util.function.Function;

import org.springframework.data.domain.Page;

/** 목록 응답 공통 모양. 앱은 hasNext 가 true 면 page+1 로 다음 목록을 요청하면 된다 */
public record PageResponse<T>(List<T> content, int page, int size, long totalElements, boolean hasNext) {

    public static <E, T> PageResponse<T> of(Page<E> page, Function<E, T> mapper) {
        return new PageResponse<>(page.getContent().stream().map(mapper).toList(), page.getNumber(), page.getSize(),
                page.getTotalElements(), page.hasNext());
    }
}
