package com.elderly.assistant.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * 智能陪聊服务
 * 使用规则匹配的方式为老年人提供温暖的对话
 * 
 * @author 
 */
@Slf4j
@Service
public class ChatService {

    // 关键词和回复模板库
    private static final Map<String, List<String>> REPLY_TEMPLATES = new HashMap<>();

    static {
        // 思念孙子
        REPLY_TEMPLATES.put("想孙子|想念孙子|孙子|想孩子", Arrays.asList(
                "孙子也很惦记您呢，有空就给他打个电话聊聊天吧～",
                "想孙子的时候可以看看他的照片，心里会暖洋洋的。",
                "等周末的时候，可以约孙子一起视频聊天，说说最近的事儿。",
                "可以让孩子帮忙教您开视频，一家人见见面心里更踏实。",
                "您可以跟我多说说孙子小时候的事儿，一定很有意思。"));

        // 学习成绩
        REPLY_TEMPLATES.put("学习|成绩|考试|读书", Arrays.asList(
                "孩子们都在慢慢长大、慢慢进步，您别太操心，注意自己的身体最重要。",
                "学习有时候好有时候一般，很正常，家里有您的支持就是最大的动力。",
                "可以多夸夸他几句，他听到您的鼓励会更有干劲的。",
                "学习成绩只是一方面，身体健康、心里开心也很重要。",
                "您的一句'我相信你'，对他来说就是最大的鼓励。"));

        // 健康相关
        REPLY_TEMPLATES.put("身体|健康|不舒服|疼|痛", Arrays.asList(
                "身体最重要，累了就多休息，按时吃药，有不舒服记得去医院看看。",
                "最近要注意饮食清淡，多喝点水，少熬夜，对身体更好。",
                "可以每天出去慢慢散散步，晒晒太阳，对身体和心情都好。",
                "感觉不舒服就早点说，不要自己一个人硬扛着。",
                "按时复查、按医生说的做，就是对自己最好的照顾。"));

        // 孤独感
        REPLY_TEMPLATES.put("孤单|寂寞|无聊|一个人", Arrays.asList(
                "有我陪您说说话呢，您也可以多和邻居、家人聊聊天。",
                "有时候觉得孤单很正常，想谁就给谁打个电话，说两句心里话。",
                "要记得，家人都惦记着您，只是有时候忙，心里还是很爱您的。",
                "可以在院子里走走，和熟悉的邻居打个招呼聊几句。",
                "您愿意的话，也可以多和我说说，我就当在您身边听着。"));

        // 心情不好
        REPLY_TEMPLATES.put("心情|不开心|难过|伤心", Arrays.asList(
                "心情不好就跟我多说说，我一直在这儿听您唠嗑。",
                "可以听听喜欢的歌、看看电视，换换心情，会慢慢好起来的。",
                "不开心的时候先深呼吸几下，慢慢来，一点点放松自己。",
                "有些事说出来，会觉得心里轻松一点。",
                "如果特别难过，可以和最信任的家人打个电话聊聊。"));

        // 天气相关
        REPLY_TEMPLATES.put("天气|下雨|刮风|热|冷", Arrays.asList(
                "天气变化的时候要注意增减衣服，别着凉了。",
                "记得看天气预报，出门带把伞，有备无患。",
                "天气好的时候，多出去走走晒晒太阳，对身体好。",
                "天冷了就多穿点，别嫌麻烦，健康最重要。",
                "雨天路滑，出门要小心，最好有人陪着一起。"));

        // 睡眠问题
        REPLY_TEMPLATES.put("睡不着|失眠|睡眠", Arrays.asList(
                "睡前可以用热水泡泡脚，有助于放松身心。",
                "别想太多事情，躺下来慢慢深呼吸，会好一些。",
                "白天可以适当活动活动，晚上会睡得更好。",
                "如果长期睡不好，记得去医院看看，医生会帮您的。",
                "睡前喝杯温牛奶，听听轻音乐，营造舒适的睡眠环境。"));

        // 饮食
        REPLY_TEMPLATES.put("吃饭|饮食|不想吃|没胃口", Arrays.asList(
                "要按时吃饭，身体才有力气，别因为麻烦就不吃。",
                "可以做些清淡可口的，少食多餐，慢慢吃不着急。",
                "没胃口的时候换换花样，吃点开胃的小菜。",
                "营养均衡很重要，蔬菜水果肉类都要吃一点。",
                "不想做饭的话，可以让家人帮忙或者叫外卖，别委屈了自己。"));

        // 问候语
        REPLY_TEMPLATES.put("你好|在吗|聊天", Arrays.asList(
                "您好呀！想聊点什么？我一直在呢。",
                "我在呢，有什么想说的尽管说。",
                "嗨，很高兴能陪您聊天。",
                "我一直都在这儿陪着您呢。"));

        // 感谢
        REPLY_TEMPLATES.put("谢谢|感谢", Arrays.asList(
                "不客气，能帮到您我很开心。",
                "您太客气了，这是我应该做的。",
                "能陪您说说话是我的荣幸。"));
    }

    /**
     * 获取AI回复
     * 
     * @param userId      用户ID
     * @param userMessage 用户消息
     * @return AI回复内容
     */
    public String getAIReply(String userId, String userMessage) {
        log.info("处理对话，用户ID: {}, 消息: {}", userId, userMessage);

        if (userMessage == null || userMessage.trim().isEmpty()) {
            return "我有点没听清，您可以再慢慢说一遍吗？";
        }

        String message = userMessage.trim();

        // 遍历关键词匹配
        for (Map.Entry<String, List<String>> entry : REPLY_TEMPLATES.entrySet()) {
            String[] keywords = entry.getKey().split("\\|");

            for (String keyword : keywords) {
                if (message.contains(keyword)) {
                    // 找到匹配的关键词，随机返回一个回复
                    List<String> replies = entry.getValue();
                    Random random = new Random();
                    return replies.get(random.nextInt(replies.size()));
                }
            }
        }

        // 没有匹配到关键词，返回通用回复
        return getDefaultReply(message);
    }

    /**
     * 获取默认回复
     */
    private String getDefaultReply(String message) {
        List<String> defaultReplies = Arrays.asList(
                "您说的很有道理，我也是这么想的。",
                "嗯嗯，我在听着呢，您接着说。",
                "真的吗？跟我详细说说呗。",
                "我明白您的意思，这个话题挺有意思的。",
                "是这样啊，那您当时是怎么想的呢？",
                "您慢慢说，我一直在听着。");

        Random random = new Random();
        return defaultReplies.get(random.nextInt(defaultReplies.size()));
    }
}
