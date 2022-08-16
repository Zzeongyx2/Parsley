import axios from "axios";
import { OpenVidu } from "openvidu-browser";
import React, { Component, createRef } from "react";
import "./StudySession.css";
import UserVideoComponent from "./UserVideoComponent";
import { connect } from "react-redux";
import { withRouter } from "react-router";
import { Link } from "react-router-dom";

// chat function
import Messages from "./Chat/Messages";
// mic on/off, video on/off, screen share, chat popper, exit, group members
import {
  BsFillMicFill,
  BsFillMicMuteFill,
  BsCameraVideoFill,
  BsCameraVideoOffFill,
  BsChatDots,
  BsThreeDots,
} from "react-icons/bs";
import { TbScreenShare } from "react-icons/tb";
import { MdExitToApp } from "react-icons/md";
import { BiGroup, BiWindows } from "react-icons/bi";

import Button from "../UI/atoms/Button";
import Swal from "sweetalert2";
import Navbar from "../UI/organisms/Navbar";

const OPENVIDU_SERVER_URL = "https://" + window.location.hostname + ":4443";
const OPENVIDU_SERVER_SECRET = "MY_SECRET";

const footerBtn = "20";
const NavBtn = "24";

class StudySession extends Component {
  constructor(props) {
    super(props);

    console.log("======= 현재 참여한 사람/세션 정보 =========");
    console.log(this.props);
    console.log(this.props.info);
    console.log(this.props.info.hostUser);
    console.log(this.props.info.name);
    console.log("========= 참여 멤버는 누구?? ===============");
    // console.log(this.props.info.members);

    const membersArr = this.props.info.members;
    console.log("현재 여기 스터디방 참가 되어있는 사람은 ????");
    console.log(membersArr);

    const memberList = [];
    for (let i = 0; i < membersArr.length; i++) {
      console.log(membersArr[i].name);
      memberList.push(membersArr[i]);
    }
    console.log("????????????????????" + memberList);

    const roomId = this.props.info.Id;

    this.state = {
      mySessionId: roomId, // 스터디룸 이름
      myUserName: this.props.user.name, // 내 이름
      hostID: this.props.info.hostUser.id, // 방장 Id
      hostUserName: this.props.info.hostUser.name, // 방장 이름
      mode: this.props.info.mode, // 손꾸락모드 = 0, 얼구리모드 = 1
      // FIXME: 이거 현재 참여한 사람으로 할지, 아니면 전체 사람으로 할지 고민중
      membersArr: this.props.info.members, // 공부방에 참여 되어있는 모든 사람들 리스트
      onlineMembers: memberList, // 현재 세션에 참가한 멤버
      //
      session: undefined,
      mainStreamManager: undefined,
      publisher: undefined,
      subscribers: [],
      //
      messages: [],
      message: "",
      //
      audiostate: true,
      screenstate: false, // 화면
      videostate: true, // 웹캠
      videoallowed: true,
      audioallowed: true,
      //
      host: {},
      isHost: false, // host인 경우만 가능한 권한 부여 (수정, 삭제)
      width: window.innerWidth,
      height: window.innerHeight,
      connectionUser: [],
      connections: [],
      connectionId: "",
      leaved: false,
      // 화면 분할 모드인가요?
      isDivided: false,
    };

    this.joinSession = this.joinSession.bind(this);
    this.leaveSession = this.leaveSession.bind(this);
    this.switchCamera = this.switchCamera.bind(this);
    this.handleChangeSessionId = this.handleChangeSessionId.bind(this);
    this.handleChangeUserName = this.handleChangeUserName.bind(this);
    this.handleMainVideoStream = this.handleMainVideoStream.bind(this);
    this.onbeforeunload = this.onbeforeunload.bind(this);
    // send message (chat)
    this.messageContainer = createRef(null);
    this.sendMessageByClick = this.sendMessageByClick.bind(this);
    this.sendMessageByEnter = this.sendMessageByEnter.bind(this);
    this.chattoggle = this.chattoggle.bind(this);
    this.handleChatMessageChange = this.handleChatMessageChange.bind(this);
    // screen share (화면공유)
    this.screenShare = this.screenShare.bind(this);
    // 참여한 멤버 확인하기
    this.sessionOnline = this.sessionOnline.bind(this);
  }

  sessionOnline = () => {
    console.log(this.state.membersArr);
  };

  // Exit button 눌렀을 때; 정말 나가시겠습니까? alert 띄워주기
  exitSessionAlert = () => {
    Swal.fire({
      title: "스터디룸을 떠나실건가요?",
      showCancelButton: true,
      confirmButtonText: "더 공부하자!",
      cancelButtonText: "그만할래",
    }).then((result) => {
      if (result.isDismissed) {
        Swal.fire({
          icon: "success",
          title: "파슬리가 응원할게요!",
          text: "오늘도 화이팅 :)",
        });
        this.leaveSession();
      }
    });
  };

  // 네비게이션 바 로고 눌렀을 때도 나갈거냐고 물어봐주기 + 이스터에그
  onClickLogo = () => {
    Swal.fire({
      title: "스터디룸을 떠나실건가요?",
      showCancelButton: true,
      confirmButtonText: "더 공부하자!",
      cancelButtonText: "그만할래",
      width: 400,
      padding: "3em",
      color: "#716add",
      background: "#fff",
      backdrop: `
        rgba(0,0,123,0.4)
        url("https://c.tenor.com/rI_0O_9AJ5sAAAAi/nyan-cat-poptart-cat.gif")
        left top
        no-repeat
      `,
    }).then((result) => {
      if (result.isDismissed) {
        Swal.fire({
          icon: "success",
          title: "파슬리가 응원할게요!",
          text: "오늘도 화이팅 :)",
        });
        this.leaveSession();
      }
    });
  };

  // 채팅 길어지면 자동으로 내려가게 ... 스크롤 기능이용
  componentDidUpdate(previousProps, previousState) {
    if (this.refs.chatoutput != null) {
      this.refs.chatoutput.scrollTop = this.refs.chatoutput.scrollHeight;
    }
    this.showVideoControls();
  }

  chattoggle() {
    this.setState({ chaton: !this.state.chaton });
  }

  sendMessageByClick() {
    if (this.state.message !== "") {
      this.setState({
        messages: [
          ...this.state.messages,
          {
            userName: this.state.myUserName,
            text: this.state.message,
            chatClass: "messagesChatClass",
            entireChatClass: "messagesEntireChatClass",
          },
        ],
      });
      const mySession = this.state.session;

      mySession.signal({
        data: `${this.state.myUserName},${this.state.message}`,
        to: [],
        type: "chat",
      });
    }

    this.setState({
      message: "",
    });
  }

  sendMessageByEnter(e) {
    if (e.key === "Enter") {
      if (this.state.message !== "") {
        this.setState({
          messages: [
            ...this.state.messages,
            {
              userName: this.state.myUserName,
              text: this.state.message,
              chatClass: "messagesChatClass",
              entireChatClass: "messagesEntireChatClass",
            },
          ],
        });
        const mySession = this.state.session;

        mySession.signal({
          data: `${this.state.myUserName},${this.state.message}`,
          to: [],
          type: "chat",
        });

        this.setState({
          message: "",
        });
      }
    }
  }

  handleChatMessageChange(e) {
    this.setState({
      message: e.target.value,
    });
  }

  // screen share onclick mode
  screenShare(e) {
    navigator.mediaDevices
      .getDisplayMedia({ audio: true, video: true })
      .then(function (stream) {
        //success
        console.log(stream);
        this.changeScreen(); // 화면 전환
      })
      .catch(function (e) {
        //error;
      });
  }

  changeScreen(stream) {
    if (this.state.mainStreamManager !== stream) {
      this.setState({
        mainStreamManager: stream,
      });
    }
  }

  componentDidMount() {
    // login user 정보 얻기 위한 api 요청해야 함
    //
    window.addEventListener("beforeunload", this.onbeforeunload);

    const constraints = { audio: true, video: true };
    navigator.mediaDevices
      .getUserMedia(constraints)
      .then(() => {
        this.setState({
          videoallowed: true,
          audioallowed: true,
        });
      })
      .catch(() => {
        this.setState({
          videoallowed: false,
          audioallowed: false,
        });
      });
  }

  componentWillUnmount() {
    window.removeEventListener("beforeunload", this.onbeforeunload);
  }

  onbeforeunload(event) {
    this.leaveSession();
  }

  handleChangeSessionId(e) {
    this.setState({
      mySessionId: e.target.value,
    });
  }

  handleChangeUserName(e) {
    this.setState({
      myUserName: e.target.value,
    });
  }

  handleMainVideoStream(stream) {
    if (this.state.mainStreamManager !== stream) {
      this.setState({
        mainStreamManager: stream,
      });
    }
  }

  deleteSubscriber(streamManager) {
    let subscribers = this.state.subscribers;
    let index = subscribers.indexOf(streamManager, 0);
    if (index > -1) {
      subscribers.splice(index, 1);
      this.setState({
        subscribers: subscribers,
      });
    }
  }

  joinSession() {
    // --- 1) Get an OpenVidu object ---

    this.OV = new OpenVidu();
    // this.OVScreen = new OpenVidu();

    // --- 2) Init a session ---

    this.setState(
      {
        session: this.OV.initSession(),
        // sessionScreen: this.OVScreen.initSession(),
      },
      () => {
        var mySession = this.state.session;
        // var sessionScreen = this.state.sessionScreen;

        // --- 3) Specify the actions when events take place in the session ---

        mySession.on("connectionCreated", (event) => {
          console.log("========= connection =========");
          console.log(event.connection);
          var connection = event.connection;
          var connections = this.state.connections;
          var connectionUser = this.state.connectionUser;
          connections.push(connection);

          var userId = connection.connectionId;
          var userName = JSON.parse(connection.data).clientData;
          connectionUser.push({ userId, userName });

          // 방장 확인
          var host = this.state.connections[0];

          this.setState({
            connections: connections,
            connectionUser: connectionUser,
            host: host,
          });

          if (this.state.connectionId === this.state.host.connectionId) {
            this.setState({ isHost: true });
          } else {
            this.setState({ isHost: false });
          }
        });

        // On every new Stream received...
        mySession.on("streamCreated", (event) => {
          // Subscribe to the Stream to receive it. Second parameter is undefined
          // so OpenVidu doesn't create an HTML video by its own
          var subscriber = mySession.subscribe(event.stream, undefined);
          var subscribers = this.state.subscribers;
          subscribers.push(subscriber);

          // Update the state with the new subscribers
          this.setState({
            subscribers: subscribers,
          });
        });

        mySession.on("signal:chat", (event) => {
          let chatdata = event.data.split(",");
          if (chatdata[0] !== this.state.myUserName) {
            this.setState({
              messages: [
                ...this.state.messages,
                {
                  userName: chatdata[0],
                  text: chatdata[1],
                  chatClass: "messagesChatClassOpp",
                  entireChatClass: "messagesEntireChatClassOpp",
                },
              ],
            });
          }
        });

        // On every Stream destroyed...
        mySession.on("streamDestroyed", (event) => {
          // Remove the stream from 'subscribers' array
          this.deleteSubscriber(event.stream.streamManager);
        });

        // On every asynchronous exception...
        mySession.on("exception", (exception) => {
          console.warn(exception);
        });

        // --- 4) Connect to the session with a valid user token ---

        // 'getToken' method is simulating what your server-side should do.
        // 'token' parameter should be retrieved and returned by your own backend
        this.getToken().then((token) => {
          // First param is the token got from OpenVidu Server. Second param can be retrieved by every user on event
          // 'streamCreated' (property Stream.connection.data), and will be appended to DOM as the user's nickname
          mySession
            .connect(token, { clientData: this.state.myUserName })
            .then(async () => {
              var devices = await this.OV.getDevices();
              var videoDevices = devices.filter(
                (device) => device.kind === "videoinput"
              );

              // --- 5) Get your own camera stream ---

              // Init a publisher passing undefined as targetElement (we don't want OpenVidu to insert a video
              // element: we will manage it on our own) and with the desired properties
              let publisher = this.OV.initPublisher(undefined, {
                // audioSource: "container-cameras", // The source of audio. If undefined default microphone
                audioSource: undefined, // The source of audio. If undefined default microphone
                // videoSource: videoDevices[0].deviceId, // The source of video. If undefined default webcam
                videoSource: undefined, // The source of video. If undefined default webcam
                publishAudio: true, // Whether you want to start publishing with your audio unmuted or not
                publishVideo: true, // Whether you want to start publishing with your video enabled or not
                resolution: "640x480", // The resolution of your video
                frameRate: 30, // The frame rate of your video
                insertMode: "APPEND", // How the video is inserted in the target element 'video-container'
                mirror: false, // Whether to mirror your local video or not
              });

              // --- 6) Publish your stream ---

              mySession.publish(publisher);

              // Set the main video in the page to display our webcam and store our Publisher
              this.setState({
                currentVideoDevice: videoDevices[0],
                mainStreamManager: publisher,
                publisher: publisher,
              });
            })
            .catch((error) => {
              console.log(
                "There was an error connecting to the session:",
                error.code,
                error.message
              );
            });
        });
      }
    );
  }

  leaveSession() {
    // --- 7) Leave the session by calling 'disconnect' method over the Session object ---

    const mySession = this.state.session;
    const sessionScreen = this.state.sessionScreen;

    if (mySession) {
      mySession.disconnect();
    }
    if (sessionScreen) {
      sessionScreen.disconnect();
    }

    // Empty all properties...
    this.OV = null;
    this.setState({
      mySessionId: "",
      myUserName: this.props.user.name,
      hostID: this.props.info.hostUser.id, // 방장 Id
      hostUserName: this.props.info.hostUser.name, // 방장 이름
      mode: this.props.info.mode, // 손꾸락모드 = 0, 얼구리모드 = 1
      //
      session: undefined,
      subscribers: [],
      mainStreamManager: undefined,
      publisher: undefined,
      //
      messages: [],
      message: "",
      //
      audiostate: true,
      screenstate: false, // 화면
      videostate: true, // 웹캠
      videoallowed: true,
      audioallowed: true,
      //
      host: {},
      // isHost: false, // host인 경우만 가능한 권한 부여 (수정, 삭제)
      connectionUser: [],
      connections: [],
      connectionId: "",
      leaved: false,
      // 화면 분할 모드인가요?
      isDivided: false,
    });
  }

  async switchCamera() {
    try {
      const devices = await this.OV.getDevices();
      var videoDevices = devices.filter(
        (device) => device.kind === "videoinput"
      );

      if (videoDevices && videoDevices.length > 1) {
        var newVideoDevice = videoDevices.filter(
          (device) => device.deviceId !== this.state.currentVideoDevice.deviceId
        );

        if (newVideoDevice.length > 0) {
          // Creating a new publisher with specific videoSource
          // In mobile devices the default and first camera is the front one
          var newPublisher = this.OV.initPublisher(undefined, {
            videoSource: newVideoDevice[0].deviceId,
            publishAudio: true,
            publishVideo: true,
            mirror: true,
          });

          //newPublisher.once("accessAllowed", () => {
          await this.state.session.unpublish(this.state.mainStreamManager);

          await this.state.session.publish(newPublisher);
          this.setState({
            currentVideoDevice: newVideoDevice,
            mainStreamManager: newPublisher,
            publisher: newPublisher,
          });
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  render() {
    // 나중에 login token도 받을 생각
    const messages = this.state.messages;
    const mySessionId = this.state.mySessionId;
    const myUserName = this.state.myUserName;

    const sendUserInfo = () => {
      axios({
        url: "https://localhost:4443/openvidu/api/sessions/SessionB/connection",
        method: "POST",
        data: {
          userId: this.state.userId,
          nickname: this.state.myUserName,
          connectionId: this.state.connectionId,
        },
      });
    };

    return (
      <div className="text-extra5">
        {/* Session 참여 전 */}
        {!this.state.session && (
          <>
            <Navbar />
            <div className="flex flex-col rounded-3xl shadow-md px-8 py-9 items-center">
              <div className="flex flex-col items-center w-full">
                <div className="flex flex-col text-main font-semibold text-2xl mt-2">
                  파슬리랑 공부할 사람?
                </div>
                {/* <img
                className=""
                src="https://images.unsplash.com/photo-1551772413-6c1b7dc18548?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80"
                alt="PARSLEY"
              /> */}
                <img
                  className="w-1/2 m-6"
                  src="https://doodleipsum.com/700/flat?i=d9b7afd47e72690f4113cb5795b3ba52"
                  alt="PARSLEY"
                />
              </div>
              <div className="flex w-full justify-center">
                <div className="flex flex-col w-full">
                  <div id="join w-full">
                    <div
                      id="join-dialog"
                      className="jumbotron vertical-center w-full"
                    >
                      <form
                        action=""
                        className="form-group w-full"
                        onSubmit={this.joinSession}
                      >
                        <div
                          className="flex font-semibold mr-3 justify-center"
                          htmlFor="userName"
                        >
                          {myUserName} 님, 공부할 준비 되셨나요?
                        </div>
                        <div
                          className="flex font-semibold mr-3"
                          htmlFor="sessionId"
                        >
                          {this.state.mySessionId}
                        </div>
                        <div className="flex justify-center w-full">
                          <div className="my-3">
                            <Button text={"준비됐어요!"} />
                          </div>
                          <Link to={`/room/${this.props.info.id}`}>
                            <div className="my-3 mx-2">
                              <button className="color-delay rounded-full px-4 py-2 text-sm font-medium bg-sub1 hover:bg-sub2 text-font3">
                                아직이요..
                              </button>
                            </div>
                          </Link>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Session 참여 후 */}
        {this.state.session && (
          <div id="session">
            <header className="h-[72px] flex items-center mt-0">
              <button
                onClick={this.onClickLogo}
                className="logo font-logo text-3xl cursor-pointer ml-4"
              >
                PARSLEY
              </button>
              <div className="dropdown">
                <label tabindex="0">
                  <BiGroup
                    onClick={this.sessionOnline}
                    className="mx-2 my-2 cursor-pointer"
                    size={NavBtn}
                  />
                </label>
                <div className="dropdown-content menu mt-[10px] shadow-lg bg-white overflow-hidden rounded-box w-[260px] absolute top-[35px] right-[-118px] pb-1">
                  <div>현재 참여한 사람</div>

                  <hr />
                  <div>세션 모든 멤버들</div>
                </div>
              </div>
              <div className="flex items-center gap-[25px] relative"></div>
            </header>
            <div className="container">
              <div className="flex flex-row">
                <div className="flex flex-col">
                  {/* // FIXME: navbar 일단 제외 */}
                  {this.state.mode === "finger" ? (
                    <div id="video-container" className="video-container">
                      {/* // TODO: 화면 넘어가는것을 carousel?? pagination?? 구현해야 할 것 같음 */}
                      {/* 잇츠 미,, 작게보이는 나,,, 가장 왼쪽에 배치했어*/}
                      {this.state.publisher !== undefined ? (
                        <div
                          className="w-[calc-96% / 2] m-[1%] col-md-6 col-xs-6"
                          onClick={() =>
                            this.handleMainVideoStream(this.state.publisher)
                          }
                        >
                          <UserVideoComponent
                            streamManager={this.state.publisher}
                          />
                        </div>
                      ) : null}
                      {/* 제 3자; subscribers */}
                      {this.state.subscribers.map((sub, i) => (
                        <div
                          key={i}
                          className="w-[calc-96% / 2] m-[1%] col-md-6 col-xs-6"
                          onClick={() => this.handleMainVideoStream(sub)}
                        >
                          <UserVideoComponent streamManager={sub} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    // 얼구리 모드
                    <div id="video-container" className="video-container">
                      {/* 상단의 작은 화면들 */}
                      {/* 잇츠 미,, 작게보이는 나,,, 가장 왼쪽에 배치했어*/}
                      {this.state.publisher !== undefined ? (
                        <div
                          className="stream-container col-md-6 col-xs-6"
                          onClick={() =>
                            this.handleMainVideoStream(this.state.publisher)
                          }
                        >
                          <UserVideoComponent
                            streamManager={this.state.publisher}
                          />
                        </div>
                      ) : null}
                      {/* 제 3자; subscribers */}
                      {this.state.subscribers.map((sub, i) => (
                        <div
                          key={i}
                          className="stream-container col-md-6 col-xs-6"
                          onClick={() => this.handleMainVideoStream(sub)}
                        >
                          <UserVideoComponent streamManager={sub} />
                        </div>
                      ))}
                      {/* 4분할 되지 않고 하나의 화면만 공유되는 경우 */}
                      {/* 클릭했을 때 다시 4분할로 돌아가도록 */}
                      <div id="main-video-onescreen">
                        {/* // TODO: isDivided ? (4분할인 경우) : (분할되지 않은 경우, onclick으로 되돌아가게) */}
                        {this.state.isDivided === false ? (
                          <UserVideoComponent
                            streamManager={this.state.mainStreamManager}
                          />
                        ) : (
                          <div id="main-video-divided">
                            <div
                              className="w-[45%]"
                              onClick={() => {
                                this.handleMainVideoStream(
                                  this.state.publisher
                                );
                              }}
                            >
                              <UserVideoComponent
                                streamManager={this.state.publisher}
                              />
                            </div>
                            {this.state.subscribers.map((sub, i) => (
                              <div
                                className="w-[45%]"
                                key={i}
                                onClick={() => {
                                  this.handleMainVideoStream(sub);
                                }}
                              >
                                <UserVideoComponent streamManager={sub} />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>{" "}
                    </div>
                  )}
                </div>
              </div>

              {/* tool bar; screen share, mic on/off, camera on/off, chat popper, exit */}
              <footer className="footer footer-center p-4  text-base-content">
                <div className="grid-flow-col gap-6 md:place-self-center">
                  {/* divided test */}
                  <button
                    onClick={() => {
                      this.setState({ isDivided: !this.state.isDivided });
                      console.log(this.state.isDivided);
                    }}
                  >
                    {/* // FIXME: 일단은 푸터에 넣어놓고,, 시간되면 바꾸기 */}
                    <BiWindows size={footerBtn} />
                  </button>
                  <div className="cursor-pointer" onClick={this.screenShare}>
                    <TbScreenShare size={footerBtn} />
                  </div>
                  {/* mic on/off */}

                  {this.state.audiostate ? (
                    <div className="cursor-pointer">
                      <BsFillMicFill
                        size={footerBtn}
                        onClick={() => {
                          this.state.publisher.publishAudio(
                            !this.state.audiostate
                          );
                          this.setState({
                            audiostate: !this.state.audiostate,
                          });
                        }}
                      />
                    </div>
                  ) : (
                    <div className="cursor-pointer">
                      <BsFillMicMuteFill
                        size={footerBtn}
                        onClick={() => {
                          this.state.publisher.publishAudio(
                            !this.state.audiostate
                          );
                          this.setState({
                            audiostate: !this.state.audiostate,
                          });
                        }}
                      />
                    </div>
                  )}
                  {/* video on/off */}
                  {this.state.videostate ? (
                    <div className="cursor-pointer">
                      <BsCameraVideoFill
                        size={footerBtn}
                        onClick={() => {
                          this.state.publisher.publishVideo(
                            !this.state.videostate
                          );
                          this.setState({
                            videostate: !this.state.videostate,
                          });
                        }}
                      />
                    </div>
                  ) : (
                    <div className="cursor-pointer">
                      <BsCameraVideoOffFill
                        size={footerBtn}
                        onClick={() => {
                          this.state.publisher.publishVideo(
                            !this.state.videostate
                          );
                          this.setState({
                            videostate: !this.state.videostate,
                          });
                        }}
                      />
                    </div>
                  )}
                  {/* chat popper */}
                  {/* // FIXME: 새 창으로 채팅방 띄우기 */}
                  {/* 새창으로 넘어가지만 콘솔 오류가 뜸 ... signal을 못읽어서 message data가 안읽혀옴 */}
                  {/* <BsChatDots
                    className="cursor-pointer"
                    onClick={() => window.open("/room/chat", "", "_blank")}
                    size={footerBtn}
                  /> */}
                  {/* 초반에 생각을 잘못 해서 모달로 구현함.. */}
                  <label htmlFor="my-modal-3" className="cursor-pointer">
                    <BsChatDots size={footerBtn} />
                  </label>
                  <input
                    type="checkbox"
                    id="my-modal-3"
                    className="modal-toggle"
                  />
                  <div className="modal">
                    <div className="modal-box relative h-3/5">
                      <label
                        htmlFor="my-modal-3"
                        className="cursor-pointer absolute right-4 top-3"
                      >
                        ✕
                      </label>
                      <div className="rounded-2xl flex flex-col bg-font3 w-auto h-full ease-in-out">
                        <div className="flex text-start p-2 text-xl h-10">
                          {this.state.mySessionId} 채팅방
                        </div>
                        <div
                          className="chatbox__messages mt-auto flex flex-col overflow-y-scroll items-end"
                          ref="chatoutput"
                        >
                          <Messages messages={messages} />
                        </div>
                        <div className="chatbox__footer">
                          <input
                            className="outline-hidden box-border w-52 h-8 input-border"
                            id="chat_message"
                            type="text"
                            placeholder="Write a message..."
                            onChange={this.handleChatMessageChange}
                            onKeyPress={this.sendMessageByEnter}
                            value={this.state.message}
                          />
                          <button
                            className="chatbox__send--footer mt-3 rounded-tr-lg rounded-br-lg"
                            onClick={this.sendMessageByClick}
                          >
                            SEND
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* exit */}
                  <div className="cursor-pointer md:place-self-end">
                    <MdExitToApp
                      size={footerBtn}
                      onClick={this.exitSessionAlert}
                    />
                  </div>
                </div>
              </footer>
            </div>
          </div>
        )}
      </div>
    );
  }

  /**
   * --------------------------
   * SERVER-SIDE RESPONSIBILITY
   * --------------------------
   * These methods retrieve the mandatory user token from OpenVidu Server.
   * This behavior MUST BE IN YOUR SERVER-SIDE IN PRODUCTION (by using
   * the API REST, openvidu-java-client or openvidu-node-client):
   *   1) Initialize a Session in OpenVidu Server	(POST /openvidu/api/sessions)
   *   2) Create a Connection in OpenVidu Server (POST /openvidu/api/sessions/<SESSION_ID>/connection)
   *   3) The Connection.token must be consumed in Session.connect() method
   */

  getToken() {
    return this.createSession(this.state.mySessionId).then((sessionId) =>
      this.createToken(sessionId)
    );
  }

  createSession(sessionId) {
    return new Promise((resolve, reject) => {
      var data = JSON.stringify({ customSessionId: sessionId });
      axios
        .post(OPENVIDU_SERVER_URL + "/openvidu/api/sessions", data, {
          headers: {
            Authorization:
              "Basic " + btoa("OPENVIDUAPP:" + OPENVIDU_SERVER_SECRET),
            "Content-Type": "application/json",
          },
        })
        .then((response) => {
          console.log("CREATE SESION", response);
          resolve(response.data.id);
        })
        .catch((response) => {
          var error = Object.assign({}, response);
          if (error?.response?.status === 409) {
            resolve(sessionId);
          } else {
            console.log(error);
            console.warn(
              "No connection to OpenVidu Server. This may be a certificate error at " +
                OPENVIDU_SERVER_URL
            );
            if (
              window.confirm(
                'No connection to OpenVidu Server. This may be a certificate error at "' +
                  OPENVIDU_SERVER_URL +
                  '"\n\nClick OK to navigate and accept it. ' +
                  'If no certificate warning is shown, then check that your OpenVidu Server is up and running at "' +
                  OPENVIDU_SERVER_URL +
                  '"'
              )
            ) {
              window.location.assign(
                OPENVIDU_SERVER_URL + "/accept-certificate"
              );
            }
          }
        });
    });
  }

  createToken(sessionId) {
    return new Promise((resolve, reject) => {
      var data = {};
      axios
        .post(
          OPENVIDU_SERVER_URL +
            "/openvidu/api/sessions/" +
            sessionId +
            "/connection",
          data,
          {
            headers: {
              Authorization:
                "Basic " + btoa("OPENVIDUAPP:" + OPENVIDU_SERVER_SECRET),
              "Content-Type": "application/json",
            },
          }
        )
        .then((response) => {
          console.log("TOKEN", response);
          resolve(response.data.token);
        })
        .catch((error) => reject(error));
    });
  }

  showVideoControls() {
    var video = document.getElementsByTagName("video");
    for (var i = 0; i < video.length; i++) {
      video[i].controls = true;
    }
  }
}

const mapToStateToProps = (state) => ({
  user: state.user.user,
  info: state.room.room,
});

const mapDispatchToProps = (dispatch) => {
  return {};
};

export default connect(mapToStateToProps, mapDispatchToProps)(StudySession);
