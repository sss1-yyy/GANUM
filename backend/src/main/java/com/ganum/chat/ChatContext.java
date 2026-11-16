package com.ganum.chat;

import java.util.List;

import com.ganum.report.ReportContent;

/**
 * 챗봇이 답할 때 참고하는 화면 맥락.
 * @param description 이 대화가 어떤 화면에서 열렸는지
 * @param facts 서버가 확인한 사실 (AI 는 이 숫자만 사용)
 * @param sources 답변에 붙일 근거
 * @param templateAnswer AI 키가 없을 때 쓸 예시 답변
 */
record ChatContext(String description, List<String> facts, List<ReportContent.Source> sources,
		String templateAnswer, String templateEasy) {
}
