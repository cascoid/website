import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Project } from "../../../data/projects";
import { twMerge } from "tailwind-merge";
import {
  IconArrowNarrowLeft,
  IconArrowNarrowRight,
  IconChevronDown,
  IconChevronUp,
} from "@tabler/icons";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  MotionValue,
  transform,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from "framer-motion";
import useOutsideClick from "../../../hooks/outsideCick";
import useMeasure from "react-use-measure";

interface Props {
  project: Project;
}

type SlideshowContextProps = {
  frameSize: number;
  trackSize: number;
  viewWidth: number;
  viewHeight: number;
  trackXOffset: MotionValue;
};

const SlideshowContext = React.createContext<SlideshowContextProps | undefined>(
  undefined
);

export const useSlideshowContext = () => {
  const contextValue = React.useContext(SlideshowContext);
  if (!contextValue) {
    throw new Error("Missing context");
  }
  return contextValue;
};

const Slideshow: React.FC<Props> = ({ project }) => {
  const [viewWidth, setViewWidth] = useState(752);
  const [viewHeight, setViewHeight] = useState(423);
  const [open, setOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(0);
  const [frameSize, setFrameSize] = useState(0);

  const frameRef = React.useRef<HTMLDivElement>(null);
  const resizeObserverRef = React.useRef<ResizeObserver>();
  const slidesRef = React.useRef<HTMLDivElement>(null);

  const item = project.media[selectedItem];

  // if slides overflows, render scroll button
  // if (slidesRef.current && slidesRef.current.scrollWidth > slidesRef.current.offsetWidth) {
  //   console.log('overflow');
  // }

  useEffect(() => {
    if (slidesRef.current) {
      setFrameSize(
        slidesRef.current.scrollWidth - slidesRef.current.offsetWidth
      );
    }
  }, []);

  const { scrollX } = useScroll({
    container: slidesRef,
  });

  // useMotionValueEvent(trackXOffset, "change", (latest) => {
  //   if (slidesRef.current) {
  //     const scrollWidth = slidesRef.current.scrollWidth;
  //     const offsetWidth = slidesRef.current.offsetWidth;
  //     if (latest > 0) {
  //       setCanScrollLeft(true);
  //     } else {
  //       setCanScrollLeft(false);
  //     }
  //     if (latest + offsetWidth < scrollWidth) {
  //       setCanScrollRight(true);
  //     } else {
  //       setCanScrollRight(false);
  //     }
  //   }
  // });

  useEffect(() => {
    resizeObserverRef.current = new ResizeObserver(() => {
      if (frameRef.current) {
        // setFrameWidth(frameRef.current.offsetWidth);
        if (frameRef.current.offsetWidth < viewWidth) {
          // find next lowest 16:9 ratio from width
          const ratio = 16 / 9;
          const nextWidth =
            Math.floor(frameRef.current.offsetWidth / ratio) * ratio;
          setViewWidth(nextWidth);
          setViewHeight(nextWidth / ratio);

          // setViewWidth(frameRef.current.offsetWidth);
          // trackXOffset.set(0);
        } else {
          setViewWidth(752);
          setViewHeight(423);
        }
      }
    });
    resizeObserverRef.current.observe(frameRef.current!);
    return () => {
      resizeObserverRef.current?.disconnect();
    };
  }, []);

  return (
    <>
      <AnimatePresence>
        {open && (
          <SearchModal
            setOpen={setOpen}
            selectedItem={selectedItem}
            setSelectedItem={setSelectedItem}
            project={project}
          />
        )}
      </AnimatePresence>
      <div
        className="col-span-3 flex cursor-pointer flex-col gap-3"
        ref={frameRef}
      >
        <div
          className="relative flex items-center justify-center overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-900"
          style={{
            width: viewWidth,
            height: viewHeight,
          }}
        >
          <ImageOrVideo item={item.src} autoPlay />
        </div>
        <div
          className="flex w-full items-center justify-between rounded-3xl border border-neutral-800 bg-neutral-900 px-9 py-5"
          onClick={() => setOpen(true)}
        >
          <div className="flex flex-col gap-1">
            <div className="text-xl font-semibold text-white">{item.title}</div>
            <div className="text-sm text-neutral-300">{item.desc}</div>
          </div>
          <div className="flex flex-col text-white">
            <IconChevronUp />
            <IconChevronDown />
          </div>
        </div>
      </div>
    </>
  );
};

export default Slideshow;

const ImageOrVideo = ({
  item,
  autoPlay,
}: {
  item: string;
  autoPlay?: boolean;
}) =>
  item.includes(".mp4") ? (
    <video playsInline muted autoPlay={!!autoPlay} src={item} />
  ) : (
    <Image
      src={item}
      fill
      quality={100}
      className="max-w-none scale-[1.02] border-none shadow-none outline-none"
      alt={`Media ${item}`}
    />
  );

interface ModalProps {
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  selectedItem: number;
  setSelectedItem: React.Dispatch<React.SetStateAction<number>>;
  project: Project;
}

const SearchModal: React.FC<ModalProps> = ({
  setOpen,
  selectedItem,
  setSelectedItem,
  project,
}) => {
  const { ref: modalRef } = useOutsideClick(() => setOpen(false));
  const listRef = useRef<HTMLDivElement>(null);

  const [search, setSearch] = useState("");
  const [locked, setLocked] = useState(false);

  const filteredMedia = useMemo(() => {
    if (search === "") {
      return project.media;
    }
    return project.media.filter((item) => {
      return item.title.toLowerCase().includes(search.toLowerCase());
    });
  }, [search]);

  const [hoveredItem, setHoveredItem] = useState(0);

  const scrollIfNextItemIsOutOfView = (itemIndex: number) => {
    if (listRef.current) {
      listRef.current.children[itemIndex].scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  };

  return (
    <motion.div
      className="absolute inset-0 z-50 flex h-full w-full justify-center bg-black/40 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: 0.15,
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          if (filteredMedia.length > 0 && filteredMedia[hoveredItem]) {
            setSelectedItem(hoveredItem);
            setOpen(false);
          }
        }

        if (e.key === "ArrowUp") {
          e.preventDefault();
          setLocked(true);
          const hovered =
            hoveredItem > 0 ? hoveredItem - 1 : filteredMedia.length - 1;
          setHoveredItem(hovered);
          scrollIfNextItemIsOutOfView(hovered);
        }

        if (e.key === "ArrowDown") {
          e.preventDefault();
          setLocked(true);
          const hovered =
            hoveredItem < filteredMedia.length - 1 ? hoveredItem + 1 : 0;
          setHoveredItem(hovered);
          scrollIfNextItemIsOutOfView(hovered);
        }
      }}
    >
      <motion.div
        className="mt-[25vh] w-full max-w-xl"
        ref={modalRef}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        layout
      >
        <motion.div
          className="rounded-2xl border border-neutral-700 bg-neutral-900 shadow-lg"
          onClick={(e) => e.stopPropagation()}
          layout
          transition={spring}
        >
          <motion.input
            layout="position"
            type="text"
            placeholder="Search..."
            autoFocus
            className="w-full border-b border-neutral-800 bg-transparent px-7 py-4 text-white outline-none placeholder:text-neutral-500"
            value={search}
            onChange={(e) => {
              setHoveredItem(0);
              setSearch(e.target.value);
            }}
          />
          <motion.div
            className="z-0 flex max-h-80 flex-col overflow-auto py-3 px-4"
            layout="position"
            transition={spring}
            ref={listRef}
          >
            {filteredMedia.length === 0 ? (
              <motion.div
                className="p-3 text-sm text-neutral-500"
                layout="position"
              >
                No results found for "{search}"
              </motion.div>
            ) : (
              filteredMedia.map((item, index) => (
                <motion.div
                  key={item.title}
                  className="relative cursor-pointer"
                  onClick={() => {
                    setSelectedItem(item.id);
                    setOpen(false);
                  }}
                  onMouseEnter={() => {
                    if (!locked) {
                      setHoveredItem(index);
                    }
                  }}
                  onMouseLeave={() => setLocked(false)}
                  layout="position"
                  transition={spring}
                >
                  {hoveredItem === index && (
                    <motion.div
                      className="absolute z-0 h-full w-full rounded-xl bg-white/10"
                      layoutId="selected"
                      transition={spring}
                      layout
                    />
                  )}
                  <motion.div
                    className="relative z-10 flex items-center gap-3 p-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div
                      className={twMerge(
                        "relative h-[72px] w-32 overflow-hidden rounded-md",
                        selectedItem === index
                          ? "bg-neutral-800"
                          : "bg-neutral-900"
                      )}
                    >
                      <ImageOrVideo item={item.src} />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">
                        {item.title}
                      </div>
                      <div className="text-xs text-neutral-500">
                        {item.desc}
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              ))
            )}
          </motion.div>
          <div
            className="flex w-full items-center justify-between border-t border-neutral-800 px-7 py-4"
            // layout="position"
            // transition={spring}
          >
            <div className="text-sm font-medium text-neutral-500">
              {project.name}
            </div>
            <div className="flex gap-2 text-sm font-medium text-white">
              View Media
              <div className="flex items-center justify-center rounded-md bg-white/5 px-2 pt-1 text-xs">
                ↵
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

const spring = {
  type: "spring",
  stiffness: 1000,
  damping: 70,
};

const easeIn = {
  hidden: {
    y: "5vh",
    opacity: 0,
  },
  visible: {
    y: "0",
    opacity: 1,
    transition: {
      duration: 0.15,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.15,
    },
  },
};