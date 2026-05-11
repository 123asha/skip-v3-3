function Frame1() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-start relative shrink-0">
      <p className="font-['CoFo_Sans_VF_Trial:Medium','Noto_Sans_Math:Regular',sans-serif] relative shrink-0 w-[459px]">① Проектная основа ↵</p>
      <p className="font-['CoFo_Sans_VF_Trial:Medium',sans-serif] opacity-30 relative shrink-0 w-[459px]">② Поддержка команды</p>
    </div>
  );
}

export default function Frame() {
  return (
    <div className="content-stretch flex flex-col font-[464] gap-[20px] items-start leading-[0.81] not-italic relative size-full text-[#231f20] text-[40px] tracking-[-0.8px]">
      <p className="font-['CoFo_Sans_VF_Trial:Medium',sans-serif] min-w-full relative shrink-0 w-[min-content] whitespace-pre-wrap">
        {`Для сотрудничества `}
        <br aria-hidden="true" />с нами выберите формат:
      </p>
      <Frame1 />
    </div>
  );
}