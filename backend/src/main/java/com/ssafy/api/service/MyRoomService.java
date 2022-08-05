package com.ssafy.api.service;

import com.ssafy.api.request.MyRoomPostReq;
import com.ssafy.db.entity.Room;
import com.ssafy.db.entity.User;
import com.ssafy.db.repository.RoomRepository;
import com.ssafy.db.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class MyRoomService {

    @Autowired
    private RoomRepository roomRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private UserService userService;
    @Autowired
    private JwtService jwtService;


    @Transactional
    public boolean addMyRoom(Long userId, MyRoomPostReq myRoomInfo){

        User user = userRepository.findByUserId(userId);
        Room room = roomRepository.findByRoomId(myRoomInfo.getRoomId());

        if(user.getJoinRooms().contains(room)){
            return false;
        }else{
            user.addUserRoom(room);
            return true;
        }
    }

    @Transactional
    public boolean addInterestRoom(Long userId, MyRoomPostReq myRoomInfo){

        User user = userRepository.findByUserId(userId);
        Room room = roomRepository.findByRoomId(myRoomInfo.getRoomId());

        if(user.getInterestRooms().contains(room)){
            return false;
        }else{
            user.getInterestRooms().add(room);
            return true;
        }
    }

    public List<Room> getMyRooms(Long userId){
        User user = userRepository.findByUserId(userId);
        return user.getJoinRooms();
    }

    public List<Room> getInterestRooms(Long userId){
        User user = userRepository.findByUserId(userId);
        return user.getInterestRooms();
    }

    @Transactional
    public boolean deleteMyRoom(Long userId, MyRoomPostReq myRoomInfo){

        User user = userRepository.findByUserId(userId);

        List<Room> rooms = user.getJoinRooms();
        Room room = roomRepository.findByRoomId(myRoomInfo.getRoomId());

        if(rooms.contains(room)){
            rooms.remove(room);
            return true;
        }else{
            return false;
        }
    }

    @Transactional
    public boolean deleteInterestRoom(Long userId, MyRoomPostReq myRoomInfo){

        User user = userRepository.findByUserId(userId);

        List<Room> rooms = user.getInterestRooms();
        Room room = roomRepository.findByRoomId(myRoomInfo.getRoomId());

        if(rooms.contains(room)){
            rooms.remove(room);
            return true;
        }else{
            return false;
        }
    }
}
