import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import ScrollHero from './components/ScrollHero';
import ProjectGallery from './components/ProjectGallery';
import Footer from './components/Footer';
import { useGsapAnimations } from './hooks/useGsapAnimations';

function ContactFormSection() {
  const [isHovered, setIsHovered] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [activeTab, setActiveTab] = useState(0); // 0 = Проектная основа, 1 = Поддержка команды
  const [taskType, setTaskType] = useState('');
  const [department, setDepartment] = useState('');
  const [formStep, setFormStep] = useState(0); // 0 = main form, 1 = strategist, 2 = art director
  const cardRef = useRef<HTMLDivElement>(null);

  const handleSkip = () => {
    if (!cardRef.current) return;

    // Animate out
    gsap.to(cardRef.current, {
      y: 50,
      opacity: 0,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => {
        setFormStep((prev) => (prev + 1) % 3);

        // Animate in
        gsap.fromTo(
          cardRef.current,
          { y: -50, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.3, ease: 'power2.out' }
        );
      },
    });
  };

  return (
    <div className="px-[20px] mt-[200px] mb-[200px]">
      <div
        data-animate="form"
        className="flex flex-col gap-[20px] items-end"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <p
          onClick={handleSkip}
          className={`decoration-solid font-['Inter',sans-serif] font-medium leading-none text-[#231f20] text-[16px] tracking-[-0.32px] underline cursor-pointer transition-opacity duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
        >
          skip
        </p>

        <div className="bg-[#8382fc] w-full relative overflow-hidden">
          {/* Fixed padding container with hover effect */}
          <div className={`transition-all duration-300 ${isHovered ? 'py-[20px]' : 'py-[40px]'}`}>
            <div
              ref={cardRef}
              className="flex items-start justify-between px-[20px] gap-[20px]"
            >
              {/* Step 0: Main Form */}
              {formStep === 0 && (
                <>
                  {/* Left: Format selection */}
                  <div className="flex flex-col gap-[20px] flex-1">
                    <p className="font-['Inter',sans-serif] font-medium leading-[0.81] text-[#231f20] text-[40px] tracking-[-0.8px]">
                      Для сотрудничества<br />с нами выберите формат:
                    </p>
                    <div className="flex flex-col gap-[10px]">
                      <p
                        onClick={() => setActiveTab(0)}
                        className={`font-['Inter',sans-serif] font-medium leading-[0.81] text-[#231f20] text-[40px] tracking-[-0.8px] cursor-pointer transition-opacity duration-300 ${
                          activeTab === 0 ? 'opacity-100' : 'opacity-30'
                        }`}
                      >
                        ① Проектная основа {activeTab === 0 && '↵'}
                      </p>
                      <p
                        onClick={() => setActiveTab(1)}
                        className={`font-['Inter',sans-serif] font-medium leading-[0.81] text-[#231f20] text-[40px] tracking-[-0.8px] cursor-pointer transition-opacity duration-300 ${
                          activeTab === 1 ? 'opacity-100' : 'opacity-30'
                        }`}
                      >
                        ② Поддержка команды {activeTab === 1 && '↵'}
                      </p>
                    </div>
                  </div>

                  {/* Right: Contact form */}
                  <div className="flex flex-col gap-[160px] w-[592px] shrink-0">
                    <div className="flex flex-col gap-[20px]">
                      <p className="font-['Inter',sans-serif] font-medium leading-none text-[#231f20] text-[16px] tracking-[-0.32px]">
                        Заполните форму.<br />Свяжемся в течение дня с 11:00-20:00
                      </p>

                      {/* Form fields */}
                      <div className="flex flex-col gap-[20px]">
                        <div className="flex items-center py-[10px] border-b border-solid border-[rgba(35,31,32,0.07)]">
                          <input
                            type="text"
                            placeholder="Имя"
                            className="bg-transparent font-['Inter',sans-serif] font-medium leading-none text-[#231f20] text-[16px] tracking-[-0.32px] placeholder:opacity-30 placeholder:text-[#231f20] outline-none w-full"
                          />
                        </div>

                        <div className="flex items-center py-[10px] border-b border-solid border-[rgba(35,31,32,0.07)]">
                          <input
                            type="text"
                            placeholder="Компания"
                            className="bg-transparent font-['Inter',sans-serif] font-medium leading-none text-[#231f20] text-[16px] tracking-[-0.32px] placeholder:opacity-30 placeholder:text-[#231f20] outline-none w-full"
                          />
                        </div>

                        {/* Conditional dropdown based on active tab */}
                        {activeTab === 0 ? (
                          <div className="flex items-center py-[10px] border-b border-solid border-[rgba(35,31,32,0.07)]">
                            <select
                              value={taskType}
                              onChange={(e) => setTaskType(e.target.value)}
                              className="bg-transparent font-['Inter',sans-serif] font-medium leading-none text-[#231f20] text-[16px] tracking-[-0.32px] outline-none w-full cursor-pointer appearance-none"
                              style={{ opacity: taskType ? 1 : 0.3 }}
                            >
                              <option value="" disabled>Тип задачи</option>
                              <option value="branding">Брендинг</option>
                              <option value="website">Сайт</option>
                              <option value="interface">Интерфейс</option>
                              <option value="automation">Автоматизация</option>
                            </select>
                          </div>
                        ) : (
                          <div className="flex items-center py-[10px] border-b border-solid border-[rgba(35,31,32,0.07)]">
                            <select
                              value={department}
                              onChange={(e) => setDepartment(e.target.value)}
                              className="bg-transparent font-['Inter',sans-serif] font-medium leading-none text-[#231f20] text-[16px] tracking-[-0.32px] outline-none w-full cursor-pointer appearance-none"
                              style={{ opacity: department ? 1 : 0.3 }}
                            >
                              <option value="" disabled>Для отдела</option>
                              <option value="marketing">Маркетинг</option>
                              <option value="product">Продукт</option>
                            </select>
                          </div>
                        )}

                        <div className="flex items-center py-[10px] border-b border-solid border-[rgba(35,31,32,0.07)]">
                          <input
                            type="text"
                            placeholder="Опишите задачу"
                            className="bg-transparent font-['Inter',sans-serif] font-medium leading-none text-[#231f20] text-[16px] tracking-[-0.32px] placeholder:opacity-30 placeholder:text-[#231f20] outline-none w-full"
                          />
                        </div>

                        <div className="flex items-center py-[10px]">
                          <button className="decoration-solid font-['Inter',sans-serif] font-medium leading-none text-[#231f20] text-[16px] tracking-[-0.32px] underline cursor-pointer bg-transparent border-none p-0">
                            Отправить
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-[10px]">
                      <div
                        onClick={() => setIsChecked(!isChecked)}
                        className="w-[16px] h-[16px] border border-solid border-[rgba(35,31,32,0.3)] cursor-pointer flex items-center justify-center transition-all duration-200"
                      >
                        {isChecked && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4L3.5 6.5L9 1" stroke="#231f20" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                      <label
                        onClick={() => setIsChecked(!isChecked)}
                        className="font-['Inter',sans-serif] font-medium leading-none text-[#231f20] text-[16px] tracking-[-0.32px] cursor-pointer"
                      >
                        Галочка про конфиденциальность
                      </label>
                    </div>
                  </div>
                </>
              )}

              {/* Step 1: Strategist Card */}
              {formStep === 1 && (
                <>
                  {/* Left: Strategist text */}
                  <div className="flex flex-col gap-[20px] flex-1">
                    <p className="font-['Inter',sans-serif] font-medium leading-[0.81] text-[#231f20] text-[40px] tracking-[-0.8px]">
                      Пообщаться<br />со стратегом,<br />обсудить<br />позиционирование
                    </p>
                  </div>

                  {/* Right: Contact form */}
                  <div className="flex flex-col gap-[160px] w-[592px] shrink-0">
                    <div className="flex flex-col gap-[20px]">
                      <p className="font-['Inter',sans-serif] font-medium leading-none text-[#231f20] text-[16px] tracking-[-0.32px]">
                        Заполните форму.<br />Свяжемся в течение дня с 11:00-20:00
                      </p>

                      {/* Form fields */}
                      <div className="flex flex-col gap-[20px]">
                        <div className="flex items-center py-[10px] border-b border-solid border-[rgba(35,31,32,0.07)]">
                          <input
                            type="text"
                            placeholder="Имя"
                            className="bg-transparent font-['Inter',sans-serif] font-medium leading-none text-[#231f20] text-[16px] tracking-[-0.32px] placeholder:opacity-30 placeholder:text-[#231f20] outline-none w-full"
                          />
                        </div>

                        <div className="flex items-center py-[10px] border-b border-solid border-[rgba(35,31,32,0.07)]">
                          <input
                            type="text"
                            placeholder="Компания"
                            className="bg-transparent font-['Inter',sans-serif] font-medium leading-none text-[#231f20] text-[16px] tracking-[-0.32px] placeholder:opacity-30 placeholder:text-[#231f20] outline-none w-full"
                          />
                        </div>

                        <div className="flex items-center py-[10px] border-b border-solid border-[rgba(35,31,32,0.07)]">
                          <input
                            type="text"
                            placeholder="Телефон или телеграм"
                            className="bg-transparent font-['Inter',sans-serif] font-medium leading-none text-[#231f20] text-[16px] tracking-[-0.32px] placeholder:opacity-30 placeholder:text-[#231f20] outline-none w-full"
                          />
                        </div>

                        <div className="flex items-center py-[10px]">
                          <button className="decoration-solid font-['Inter',sans-serif] font-medium leading-none text-[#231f20] text-[16px] tracking-[-0.32px] underline cursor-pointer bg-transparent border-none p-0">
                            Отправить
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-[10px]">
                      <div
                        onClick={() => setIsChecked(!isChecked)}
                        className="w-[16px] h-[16px] border border-solid border-[rgba(35,31,32,0.3)] cursor-pointer flex items-center justify-center transition-all duration-200"
                      >
                        {isChecked && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4L3.5 6.5L9 1" stroke="#231f20" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                      <label
                        onClick={() => setIsChecked(!isChecked)}
                        className="font-['Inter',sans-serif] font-medium leading-none text-[#231f20] text-[16px] tracking-[-0.32px] cursor-pointer"
                      >
                        Галочка про конфиденциальность
                      </label>
                    </div>
                  </div>
                </>
              )}

              {/* Step 2: Art Director Card */}
              {formStep === 2 && (
                <>
                  {/* Left: Art Director text */}
                  <div className="flex flex-col gap-[20px] flex-1">
                    <p className="font-['Inter',sans-serif] font-medium leading-[0.81] text-[#231f20] text-[40px] tracking-[-0.8px]">
                      Пообщаться<br />с арт-директором<br />про визуальную<br />систему
                    </p>
                  </div>

                  {/* Right: Contact form */}
                  <div className="flex flex-col gap-[160px] w-[592px] shrink-0">
                    <div className="flex flex-col gap-[20px]">
                      <p className="font-['Inter',sans-serif] font-medium leading-none text-[#231f20] text-[16px] tracking-[-0.32px]">
                        Заполните форму.<br />Свяжемся в течение дня с 11:00-20:00
                      </p>

                      {/* Form fields */}
                      <div className="flex flex-col gap-[20px]">
                        <div className="flex items-center py-[10px] border-b border-solid border-[rgba(35,31,32,0.07)]">
                          <input
                            type="text"
                            placeholder="Имя"
                            className="bg-transparent font-['Inter',sans-serif] font-medium leading-none text-[#231f20] text-[16px] tracking-[-0.32px] placeholder:opacity-30 placeholder:text-[#231f20] outline-none w-full"
                          />
                        </div>

                        <div className="flex items-center py-[10px] border-b border-solid border-[rgba(35,31,32,0.07)]">
                          <input
                            type="text"
                            placeholder="Компания"
                            className="bg-transparent font-['Inter',sans-serif] font-medium leading-none text-[#231f20] text-[16px] tracking-[-0.32px] placeholder:opacity-30 placeholder:text-[#231f20] outline-none w-full"
                          />
                        </div>

                        <div className="flex items-center py-[10px] border-b border-solid border-[rgba(35,31,32,0.07)]">
                          <input
                            type="text"
                            placeholder="Телефон или телеграм"
                            className="bg-transparent font-['Inter',sans-serif] font-medium leading-none text-[#231f20] text-[16px] tracking-[-0.32px] placeholder:opacity-30 placeholder:text-[#231f20] outline-none w-full"
                          />
                        </div>

                        <div className="flex items-center py-[10px]">
                          <button className="decoration-solid font-['Inter',sans-serif] font-medium leading-none text-[#231f20] text-[16px] tracking-[-0.32px] underline cursor-pointer bg-transparent border-none p-0">
                            Отправить
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-[10px]">
                      <div
                        onClick={() => setIsChecked(!isChecked)}
                        className="w-[16px] h-[16px] border border-solid border-[rgba(35,31,32,0.3)] cursor-pointer flex items-center justify-center transition-all duration-200"
                      >
                        {isChecked && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4L3.5 6.5L9 1" stroke="#231f20" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                      <label
                        onClick={() => setIsChecked(!isChecked)}
                        className="font-['Inter',sans-serif] font-medium leading-none text-[#231f20] text-[16px] tracking-[-0.32px] cursor-pointer"
                      >
                        Галочка про конфиденциальность
                      </label>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  useGsapAnimations();

  return (
    <div className="min-h-screen w-full bg-white">
      <ScrollHero />

      {/* Project Gallery Section */}
      <div id="cases">
        <ProjectGallery />
      </div>

      {/* Studio Section */}
      <div id="studio" className="px-[20px] mt-[200px]">
        <div className="flex flex-col gap-[80px]">
          {/* 5 columns grid layout */}
          <div className="grid grid-cols-5 gap-[20px]">
            {/* Column 1: Title */}
            <div className="col-span-1">
              <p data-animate="title" className="font-['Inter',sans-serif] font-medium leading-none text-[#231f20] text-[16px] tracking-[-0.32px]">
                Студия
              </p>
            </div>

            {/* Column 2: Empty */}
            <div className="col-span-1"></div>

            {/* Column 3: Description */}
            <div className="col-span-1">
              <p data-animate="text-line" className="font-['Inter',sans-serif] font-medium leading-none text-[#231f20] text-[16px] tracking-[-0.32px]">
                Skip Design — бутиковая студия цифрового дизайна и автоматизации продакшна.
              </p>
            </div>

            {/* Column 4: Philosophy and Clients */}
            <div className="col-span-1 flex flex-col gap-[40px]">
              <p data-animate="text-line" className="font-['Inter',sans-serif] font-medium leading-none text-[#231f20] text-[16px] tracking-[-0.32px]">
                Верим, что простота — не про упрощение, а смелость скипнуть лишнее, что мешает проявиться сути.
              </p>

              <div className="flex flex-col gap-[20px]">
                <p data-animate="text-line" className="font-['Inter',sans-serif] font-medium leading-none text-[#231f20] text-[16px] tracking-[-0.32px]">
                  Нам доверяют задачи:
                </p>
                <div className="flex flex-col gap-[20px] text-[40px] leading-[0.81] tracking-[-0.8px] font-['Inter',sans-serif] font-medium text-[#231f20]">
                  <p data-animate="text-line">AliExpress</p>
                  <p data-animate="text-line">Gate Legal</p>
                  <p data-animate="text-line">Юрий Мурадян</p>
                  <p data-animate="text-line">Futura Digital</p>
                  <p data-animate="text-line">Senior*s</p>
                </div>
              </div>
            </div>

            {/* Column 5: Empty */}
            <div className="col-span-1"></div>
          </div>
        </div>
      </div>

      {/* Tools and Solutions Section */}
      <div id="tools" className="px-[20px] mt-[200px]">
        <div className="flex flex-col gap-[80px]">
          <p data-animate="title" className="font-['Inter',sans-serif] font-medium leading-none text-[#231f20] text-[16px] tracking-[-0.32px]">
            Инструменты и решения
          </p>

          <div className="flex flex-col gap-[40px] w-full">
            {/* Row 1 */}
            <div data-animate="grid-item" className="grid grid-cols-5 gap-[20px] items-start pt-[12px] relative w-full border-t border-solid border-[rgba(35,31,32,0.12)]">
              <p className="col-span-1 font-['Inter',sans-serif] font-medium leading-none text-[#231f20] text-[16px] tracking-[-0.32px]">
                Конструктор
              </p>
              <div className="col-span-1"></div>
              <p className="col-span-1 font-['Inter',sans-serif] font-medium leading-none text-[#231f20] text-[16px] tracking-[-0.32px]">
                Skip Design — бутиковая студия цифрового дизайна и автоматизации продакшна. <span className="underline decoration-dotted cursor-pointer">Читать</span>
              </p>
              <div className="col-span-1"></div>
              <p className="col-span-1 font-['Inter',sans-serif] font-medium leading-none text-[#231f20] text-[16px] tracking-[-0.32px] text-right">
                2026
              </p>
            </div>

            {/* Row 2 */}
            <div data-animate="grid-item" className="grid grid-cols-5 gap-[20px] items-start pt-[12px] relative w-full border-t border-solid border-[rgba(35,31,32,0.12)]">
              <p className="col-span-1 font-['Inter',sans-serif] font-medium leading-none text-[#231f20] text-[16px] tracking-[-0.32px]">
                Метод
              </p>
              <div className="col-span-1"></div>
              <p className="col-span-1 font-['Inter',sans-serif] font-medium leading-none text-[#231f20] text-[16px] tracking-[-0.32px]">
                Skip Design — бутиковая студия цифрового дизайна и автоматизации продакшна. <span className="underline decoration-dotted cursor-pointer">Читать</span>
              </p>
              <div className="col-span-1"></div>
              <p className="col-span-1 font-['Inter',sans-serif] font-medium leading-none text-[#231f20] text-[16px] tracking-[-0.32px] text-right">
                2026
              </p>
            </div>

            {/* Row 3 */}
            <div data-animate="grid-item" className="grid grid-cols-5 gap-[20px] items-start pt-[12px] relative w-full border-t border-solid border-[rgba(35,31,32,0.12)]">
              <p className="col-span-1 font-['Inter',sans-serif] font-medium leading-none text-[#231f20] text-[16px] tracking-[-0.32px]">
                Решение
              </p>
              <div className="col-span-1"></div>
              <p className="col-span-1 font-['Inter',sans-serif] font-medium leading-none text-[#231f20] text-[16px] tracking-[-0.32px]">
                Skip Design — бутиковая студия цифрового дизайна и автоматизации продакшна. <span className="underline decoration-dotted cursor-pointer">Читать</span>
              </p>
              <div className="col-span-1"></div>
              <p className="col-span-1 font-['Inter',sans-serif] font-medium leading-none text-[#231f20] text-[16px] tracking-[-0.32px] text-right">
                2026
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Form Section */}
      <ContactFormSection />

      {/* Footer with curtain effect */}
      <Footer />
    </div>
  );
}