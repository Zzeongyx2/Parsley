package com.ssafy.api.service;

import com.ssafy.db.entity.Notification;
import com.ssafy.db.entity.User;
import com.ssafy.db.repository.NotificationRepository;
import com.ssafy.db.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 알림 비즈니스 로직 처리를 위한 서비스 구현 정의.
 */

@Service
@Transactional(readOnly = true)
public class NotificationService {

    @Autowired
    UserRepository userRepository;

    @Autowired
    NotificationRepository notificationRepository;

    @Transactional
    public List<Notification> getNotifications(Long userId){
        User user = userRepository.findByUserId(userId);
        List<Notification> notifications = user.getNotificationHistory();
        for(Notification notification : notifications){
            if(!notification.isCheck()){
                notification.setCheck(true);
            }
        }
        return notifications;
    }

    public int getUncheckedNotificationsCnt(Long userId){
        User user = userRepository.findByUserId(userId);
        List<Notification> notifications = user.getNotificationHistory();
        int uncheckCnt = 0;
        for(Notification notification : notifications){
            if(!notification.isCheck()){
                uncheckCnt++;
            }
        }
        return uncheckCnt;
    }

    @Transactional
    public void deleteNotifications(Long userId){
        User user = userRepository.findByUserId(userId);
        List<Notification> notifications = user.getNotificationHistory();
        for(Notification notification : notifications){
            notificationRepository.delete(notification);
        }
    }
}
