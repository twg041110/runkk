package com.example.runkk.safety;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.runkk.common.ApiException;
import com.example.runkk.friend.FriendRepository;
import com.example.runkk.member.Member;
import com.example.runkk.member.MemberDto;
import com.example.runkk.member.MemberService;

@Service
@Transactional(readOnly = true)
public class SafetyService {

    private final BlockRepository blocks;
    private final ReportRepository reports;
    private final FriendRepository friends;
    private final MemberService memberService;

    public SafetyService(BlockRepository blocks, ReportRepository reports, FriendRepository friends,
            MemberService memberService) {
        this.blocks = blocks;
        this.reports = reports;
        this.friends = friends;
        this.memberService = memberService;
    }

    public List<SafetyController.BlockItem> blocks(Long me) {
        return blocks.findMyBlocks(me).stream()
                .map(b -> new SafetyController.BlockItem(b.getBlockId(), MemberDto.Simple.of(b.getBlocked()), b.getCreatedAt()))
                .toList();
    }

    /** 차단하면 친구 관계와 친구 요청도 함께 지운다 */
    @Transactional
    public SafetyController.BlockItem block(Long me, Long targetId) {
        if (me.equals(targetId)) {
            throw ApiException.badRequest("나를 차단할 수는 없어요.");
        }
        Member blocker = memberService.getActive(me);
        Member target = memberService.getOther(targetId);
        if (blocks.existsByBlockerMemberIdAndBlockedMemberId(me, targetId)) {
            throw ApiException.conflict("이미 차단한 회원이에요.");
        }
        friends.deleteAll(friends.findBetween(me, targetId));
        Block b = new Block();
        b.setBlocker(blocker);
        b.setBlocked(target);
        blocks.save(b);
        return new SafetyController.BlockItem(b.getBlockId(), MemberDto.Simple.of(target), b.getCreatedAt());
    }

    @Transactional
    public void unblock(Long me, Long targetId) {
        blocks.findByBlockerMemberIdAndBlockedMemberId(me, targetId).ifPresent(blocks::delete);
    }

    @Transactional
    public void report(Long me, SafetyController.ReportRequest req) {
        Member reporter = memberService.getActive(me);
        if (reports.existsByReporterMemberIdAndTargetTypeAndTargetIdAndStatus(me, req.targetType(),
                req.targetId(), Report.Status.RECEIVED)) {
            throw ApiException.conflict("이미 신고했어요. 확인 후 조치할게요.");
        }
        Report r = new Report();
        r.setReporter(reporter);
        r.setTargetType(req.targetType());
        r.setTargetId(req.targetId());
        r.setReason(req.reason().trim());
        reports.save(r);
    }
}
