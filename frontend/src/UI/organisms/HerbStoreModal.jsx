import React, { useState } from "react";
// import HerbStoreItemCard from "../atoms/HerbStoreItemCard";
import HerbItemAvatar from "../atoms/HerbItemAvatar";
// 허브 아이템 선택 아바타 라디오버튼
import HerbStoreItemAvatar from "../atoms/HerbStoreItemAvatar";
import { useAddHerbMutation, useGetAllItemsQuery } from "../../services/farm";
import { setFertilizer, setSeed, setWater } from "../../modules/farmReducer";
import { useDispatch, useSelector } from "react-redux";

function HerbStoreModal({ showModal, handleModal, clickCancel }) {
  const dispatch = useDispatch();
  const seedId = useSelector((state) => state?.farm.itemSeedId);
  const fertilizerId = useSelector((state) => state?.farm.itemFertilizerId);
  const waterId = useSelector((state) => state?.farm.itemWaterId);
  const user = useSelector((state) => state?.user.user);

  const herbInfo = useSelector((state) => state?.farm);
  const { data: allItems } = useGetAllItemsQuery();
  const [addHerb] = useAddHerbMutation();

  const totalSley =
    parseInt(allItems?.itemSeeds[seedId - 1].sley) +
    parseInt(allItems?.itemFertilizers[fertilizerId - 1].sley) +
    parseInt(allItems?.itemWaters[waterId - 1].sley);

  const [possibility, setPosibility] = useState(true);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (user?.currentSley >= totalSley) {
      setPosibility(true);
      await addHerb({ herb: herbInfo, totalSley });
      handleModal();
      if (!showModal) {
        window.location.reload();
      }
    } else {
      setPosibility(false);
    }
  };

  return (
    <div>
      <input type="checkbox" id="my-modal-3" className="modal-toggle" />
      <div className="modal">
        <div className="modal-box w-11/12 max-w-5xl p-6">
          <div className="flex w-full justify-between">
            <h3 className="font-bold text-xl py-2">허브 심기</h3>
            {/* Exit Button */}
            <button onClick={handleModal}>
              <label
                htmlFor="my-modal-3"
                className="btn btn-ghost right-2 top-2"
              >
                <i className="bx bx-x bx-sm"></i>
              </label>
            </button>
          </div>
          <div className="flex justify-evenly">
            <div>
              {/* 씨앗 */}
              <div className="py-4">
                <p className="font-semibold">STEP 1. 씨앗을 구매해요!</p>
                <div className="flex flex-wrap">
                  {allItems?.itemSeeds.map((option) => (
                    <label key={option.itemId}>
                      <input
                        className="hidden"
                        type="radio"
                        // checked={items.seed === `${option.title}`}
                        onClick={() => dispatch(setSeed(option.itemId))}
                      />
                      <HerbStoreItemAvatar
                        title={option.name}
                        price={option.sley}
                        imgUrl={"/herbs/seeds.png"}
                        checked={option.itemId === seedId}
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* 비료 */}
              <div className="py-4">
                <p className="font-semibold">STEP2. 비료를 구매해요!</p>
                <div className="flex flex-wrap">
                  {allItems?.itemFertilizers.map((option) => (
                    <label key={option.itemId}>
                      <input
                        className="hidden"
                        type="radio"
                        // checked={items.fertilizer === `${option.title}`}
                        onClick={() => dispatch(setFertilizer(option.itemId))}
                      />
                      <HerbStoreItemAvatar
                        title={option.name}
                        price={option.sley}
                        imgUrl={"herbs/fertilizer.png"}
                        checked={option.itemId === fertilizerId}
                      />
                    </label>
                  ))}
                </div>
              </div>
              {/* 물뿌리개 */}
              <div className="py-4">
                <p className="font-semibold">STEP3. 물뿌리개를 구매해요!</p>
                <div className="flex flex-wrap">
                  {allItems?.itemWaters.map((option) => (
                    <label key={option.itemId}>
                      <input
                        className="hidden"
                        type="radio"
                        onClick={() => dispatch(setWater(option.itemId))}
                      />
                      <HerbStoreItemAvatar
                        title={option.name}
                        price={option.sley}
                        imgUrl={"/herbs/watering-can.png"}
                        checked={option.itemId === waterId}
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>
            {/* 아이템 선택 목록 a.k.a. 구매목록! */}
            {/* // TODO: 화면 WIDTH 좁아졌을 때 구매목록 어떻게 처리할지 ?? */}
            <div className="shadow rounded-xl w-[300px] h-auto my-3 ml-10 py-3">
              <p className="text-xs text-right mx-3">
                보유 슬리 : {user.currentSley}
              </p>
              <p className="text-lg mt-4 font-semibold text-center">
                구매 목록
              </p>
              <div className="mt-10 flex flex-col w-full">
                {/* 씨앗 선택 내역 */}
                <div className="flex w-full px-4 mb-4 items-center">
                  <div className="flex justify-center w-1/4 mr-6">
                    <HerbItemAvatar imgUrl="/herbs/seeds.png" />
                  </div>
                  <span className="w-1/3 text-start text-sm">
                    {allItems?.itemSeeds[seedId - 1].name}
                  </span>
                  <span className="w-1/3 text-end text-sm">
                    {allItems?.itemSeeds[seedId - 1].sley}슬리
                  </span>
                </div>
                {/* 비료 선택 내역 */}
                <div className="flex w-full px-4 mb-4 items-center">
                  <div className="flex justify-center w-1/4 mr-6">
                    <HerbItemAvatar imgUrl="/herbs/fertilizer.png" />
                  </div>
                  <span className="w-1/3 text-start text-sm">
                    {allItems?.itemFertilizers[fertilizerId - 1].name}
                  </span>
                  <span className="w-1/3 text-end text-sm">
                    {allItems?.itemFertilizers[fertilizerId - 1].sley}
                    슬리
                  </span>
                </div>
                {/* 물뿌리개 선택 내역 */}
                <div className="flex w-full px-4 mb-4 items-center">
                  <div className="flex justify-center w-1/4 mr-6">
                    <HerbItemAvatar imgUrl="/herbs/watering-can.png" />
                  </div>
                  <span className="w-1/3 text-start text-sm">
                    {allItems?.itemWaters[waterId - 1].name}
                  </span>
                  <span className="w-1/3 text-end text-sm">
                    {allItems?.itemWaters[waterId - 1].sley}슬리
                  </span>
                </div>
                {/* 총 슬리 합계 */}
                <div className="m-10 font-semibold text-center text-xl">
                  총 {totalSley} 슬리 입니다
                  {/* 슬리 이미지 아바타로 넣기 */}
                  <div className="avatar">
                    <div className="ml-2 w-6 rounded-full">
                      <img src="/herbs/sley.png" alt="sley" />
                    </div>
                  </div>
                  <p className="text-base font-normal py-3">
                    이제 심으러 가볼까요?
                  </p>
                  {possibility ? (
                    <p className="text-xs font-normal py-3"></p>
                  ) : (
                    <p className="text-red-400 text-xs font-normal py-3">
                      슬리가 부족합니다.
                    </p>
                  )}
                </div>
                {/* 초기화, 심으러 가기 버튼 */}
                <div className="flex items-center justify-evenly">
                  <button
                    className="color-delay rounded-full px-4 py-2 text-sm font-semibold bg-main hover:bg-sub2 text-font3"
                    onClick={() => {
                      clickCancel();
                      setPosibility(true);
                    }}
                  >
                    초기화 <i className="bx bx-revision"></i>
                  </button>
                  {/* <button
                className=" color-delay rounded-full text-sm font-semibold bg-main hover:bg-sub2 text-font3"
                onClick={onSubmit}
              > */}
                  <label
                    htmlFor="my-modal-3"
                    className="cursor-pointer px-4 py-2 color-delay rounded-full text-sm font-semibold bg-main hover:bg-sub2 text-font3"
                    onClick={onSubmit}
                  >
                    선택 완료
                  </label>
                  {/* </button> */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HerbStoreModal;
