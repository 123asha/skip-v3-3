import { useState, useEffect, useRef } from 'react';

const categories = ['Брендинг', 'Сайты', 'Интерфейсы'];

const projects = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1770315200927-b7282cffbd45?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBicmFuZGluZyUyMGRlc2lnbnxlbnwxfHx8fDE3Nzg0MzI5MTF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    title: 'Брендинг AliExpress',
    description: 'Исследования рынка, категории и целевой аудитории.',
    link: 'Перейти'
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1560461396-ec0ef7bb29dd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsJTIwcHJvZHVjdCUyMGRlc2lnbnxlbnwxfHx8fDE3Nzg0MzI5MTJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    title: 'Gate Legal',
    description: 'Платформа бренда и визуальная идентичность',
    link: 'Перейти'
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1618761714954-0b8cd0026356?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1aSUyMGRlc2lnbiUyMGludGVyZmFjZXxlbnwxfHx8fDE3Nzg0MzI5MTZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    title: 'Senior\'s Platform',
    description: 'Дизайн-система и интерфейсы',
    link: 'Перейти'
  },
  {
    id: 4,
    image: 'https://images.unsplash.com/photo-1609921212029-bb5a28e60960?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmFwaGljJTIwZGVzaWduJTIwd29ya3NwYWNlfGVufDF8fHx8MTc3ODQzMjkxMnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    title: 'Futura Digital',
    description: 'Нейминг и регистрация, платформа бренда',
    link: 'Перейти'
  },
  {
    id: 5,
    image: 'https://images.unsplash.com/photo-1774999631724-1854d2daafc2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjbGVhbiUyMGJyYW5kJTIwaWRlbnRpdHl8ZW58MXx8fHwxNzc4NDMyOTEzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    title: 'Юрий Мурадян',
    description: 'Персональный брендинг',
    link: 'Перейти'
  },
  {
    id: 6,
    image: 'https://images.unsplash.com/photo-1711563386439-75ce269ac998?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwcHJvZHVjdCUyMG1vY2t1cHxlbnwxfHx8fDE3Nzg0MzI5MTN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    title: 'Digital Experience',
    description: 'Исследования и автоматизация процессов',
    link: 'Перейти'
  }
];

export default function ProjectGallery() {
  const [activeCategory, setActiveCategory] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const containerTop = containerRect.top;
      const viewportHeight = window.innerHeight;

      // Trigger when row starts entering the middle of viewport
      const triggerPoint = viewportHeight * 0.5;

      // Get all rows
      const rows = containerRef.current.querySelectorAll('.project-row');

      if (rows.length >= 3) {
        const row1 = rows[0].getBoundingClientRect();
        const row2 = rows[1].getBoundingClientRect();
        const row3 = rows[2].getBoundingClientRect();

        if (row3.top < triggerPoint) {
          setActiveCategory(2); // Интерфейсы
        } else if (row2.top < triggerPoint) {
          setActiveCategory(1); // Сайты
        } else {
          setActiveCategory(0); // Брендинг
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div ref={containerRef} className="bg-white relative w-full">
      {/* Navigation tabs - sticky positioned */}
      <div className="sticky top-0 left-0 right-0 z-50 content-stretch flex flex-col items-center py-[20px] mb-[120px] mix-blend-difference">
        <div className="content-stretch flex font-['Inter',sans-serif] font-medium gap-[20px] h-[16px] items-center leading-none pl-[20px] relative shrink-0 text-white text-[16px] tracking-[-0.32px] whitespace-nowrap">
          <p className="relative shrink-0">Разработали</p>
          <div className="content-stretch flex gap-[10px] items-center relative shrink-0">
            {categories.map((category, idx) => (
              <button
                key={idx}
                onClick={() => setActiveCategory(idx)}
                className={`relative shrink-0 transition-opacity duration-300 hover:opacity-100 ${
                  activeCategory === idx ? 'opacity-100' : 'opacity-30'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content grid - 5 column grid system */}
      <div className="relative bg-white w-full px-[20px]">
        <div className="flex flex-col gap-[120px]">
          {/* Row 1: Horizontal + Vertical */}
          <div className="grid grid-cols-5 gap-[20px] project-row">
            <div className="col-span-2">
              <ProjectCard
                image={projects[0].image}
                aspectRatio="612/345"
                title={projects[0].title}
                description={projects[0].description}
                link={projects[0].link}
              />
            </div>
            <div className="col-span-1"></div>
            <div className="col-span-2">
              <ProjectCard
                image={projects[1].image}
                aspectRatio="612/765"
                title={projects[1].title}
                description={projects[1].description}
                link={projects[1].link}
              />
            </div>
          </div>

          {/* Row 2: Horizontal + Vertical */}
          <div className="grid grid-cols-5 gap-[20px] project-row">
            <div className="col-span-1"></div>
            <div className="col-span-2">
              <ProjectCard
                image={projects[2].image}
                aspectRatio="612/345"
                title={projects[2].title}
                description={projects[2].description}
                link={projects[2].link}
              />
            </div>
            <div className="col-span-2">
              <ProjectCard
                image={projects[3].image}
                aspectRatio="612/765"
                title={projects[3].title}
                description={projects[3].description}
                link={projects[3].link}
              />
            </div>
          </div>

          {/* Row 3: Horizontal only */}
          <div className="grid grid-cols-5 gap-[20px] project-row">
            <div className="col-span-2">
              <ProjectCard
                image={projects[4].image}
                aspectRatio="612/345"
                title={projects[4].title}
                description={projects[4].description}
                link={projects[4].link}
              />
            </div>
            <div className="col-span-3"></div>
          </div>

          {/* Row 4: Vertical only */}
          <div className="grid grid-cols-5 gap-[20px] project-row">
            <div className="col-span-2"></div>
            <div className="col-span-2">
              <ProjectCard
                image={projects[5].image}
                aspectRatio="612/765"
                title={projects[5].title}
                description={projects[5].description}
                link={projects[5].link}
              />
            </div>
            <div className="col-span-1"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ProjectCardProps {
  image: string;
  aspectRatio: string;
  title?: string;
  description?: string;
  link?: string;
}

function ProjectCard({ image, aspectRatio, title, description, link }: ProjectCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      data-animate="card"
      className="relative w-full cursor-pointer bg-white flex flex-col overflow-hidden"
      style={{ aspectRatio }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Top text area - appears on hover */}
      <div
        className={`transition-all duration-300 ease-out bg-white relative z-0 ${
          isHovered ? 'h-[36px] pt-[10px]' : 'h-0'
        }`}
      >
        {title && (
          <p
            className={`font-['Inter',sans-serif] font-medium leading-none text-[#231f20] text-[16px] tracking-[-0.32px] transition-opacity duration-300 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {title}
          </p>
        )}
      </div>

      {/* Image - shrinks on hover, image scales up */}
      <div className="flex-1 overflow-hidden bg-[#f6f6f6] relative z-10">
        <img
          alt=""
          className={`w-full h-full object-cover transition-transform duration-300 ease-out ${
            isHovered ? 'scale-105' : 'scale-100'
          }`}
          src={image}
        />
      </div>

      {/* Bottom text area - appears on hover */}
      <div
        className={`transition-all duration-300 ease-out bg-white relative z-0 ${
          isHovered ? 'h-[36px] pb-[10px]' : 'h-0'
        }`}
      >
        {description && link && (
          <p
            className={`font-['Inter',sans-serif] font-medium leading-none text-[#231f20] text-[16px] tracking-[-0.32px] transition-opacity duration-300 flex items-end h-full ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {description}<span className="inline-block w-[4px]"></span><span className="underline decoration-dotted">{link}</span>
          </p>
        )}
      </div>
    </div>
  );
}