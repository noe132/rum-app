import React from 'react';
import { action, autorun, runInAction } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { Popover, PopoverProps } from '@material-ui/core';
import { emojis } from './emoji';
import { lang } from './lang';

interface Props extends PopoverProps {
  onSelectEmoji?: (emoji: string) => unknown
}

const RECENT_EMOJI_STORAGE_KEY = 'RECENT_EMOJI_LIST';

export const EmojiPicker = observer((props: Props) => {
  const state = useLocalObservable(() => ({
    category: 0,
    categoryBoxes: [] as Array<HTMLDivElement>,
    recent: ['😀'] as Array<string>,
  }));
  const { onSelectEmoji, ...popoverProps } = props;

  const scrollBox = React.useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (!scrollBox.current) {
      return;
    }
    const scrollTop = scrollBox.current.scrollTop;
    if (state.recent.length && scrollTop < state.categoryBoxes[1].offsetTop - 1) {
      runInAction(() => {
        state.category = 0;
      });
      return;
    }
    const position = state.categoryBoxes
      .map((v) => v.offsetTop - scrollTop)
      .map((v, i) => [v, i])
      .filter((v) => v[0] < 200)
      .reverse()[0][1];

    runInAction(() => {
      state.category = position;
    });
  };

  const handleScrollTo = (i: number) => {
    const box = state.categoryBoxes[i];
    if (!scrollBox.current || !box) {
      return;
    }

    scrollBox.current.scrollTo({
      top: box.offsetTop,
      behavior: 'smooth',
    });
  };

  const handleSelect = action((e: string) => {
    onSelectEmoji?.(e);
    if (state.recent.some((v) => v === e)) {
      state.recent.splice(state.recent.indexOf(e), 1);
    }
    state.recent.unshift(e);
    if (state.recent.length > 9) {
      state.recent.length = 9;
    }
  });

  const loadRecentEmoji = action(() => {
    try {
      state.recent = JSON.parse(localStorage.getItem(RECENT_EMOJI_STORAGE_KEY) || '');
    } catch (e) {}
  });

  React.useEffect(() => {
    loadRecentEmoji();

    return autorun(() => {
      localStorage.setItem(RECENT_EMOJI_STORAGE_KEY, JSON.stringify(state.recent));
    });
  }, []);

  React.useEffect(action(() => {
    if (props.open) {
      loadRecentEmoji();
      state.category = 0;
    }
  }), [props.open]);

  return (<>
    <Popover
      {...popoverProps}
      transitionDuration={180}
    >
      <div className="relative border-b flex text-20">
        <div
          className="flex flex-center w-9 h-10 pb-1 select-none cursor-pointer hover:bg-gray-ec"
          onClick={() => scrollBox.current!.scrollTo({ top: 0, behavior: 'smooth' })}
          title={lang.recent}
        >
          🕒
        </div>
        {emojis.map((v, i) => (
          <div
            className="flex flex-center w-9 h-10 pb-1 select-none cursor-pointer hover:bg-gray-ec"
            key={v.id}
            onClick={() => handleScrollTo(i + 1)}
            title={lang[v.id]}
          >
            {v.title}
          </div>
        ))}
        <div
          className="absolute h-[3px] w-9 bottom-0 bg-red-400 duration-200"
          style={{
            left: state.category * 36,
          }}
        />
      </div>
      <div
        className="relative bg-white flex flex-col w-auto h-[300px] overflow-x-hidden overflow-y-scroll"
        ref={scrollBox}
        onScroll={handleScroll}
      >
        <div>
          <div
            className="pl-1 py-px mt-1 text-16 font-bold"
            ref={(ref) => { if (ref) { runInAction(() => { state.categoryBoxes[0] = ref; }); } }}
          >
            {lang.recent}
          </div>
          <div className="grid text-20 justify-center w-[324px] select-none">
            {state.recent.map((e) => (
              <div
                className="flex flex-center w-8 h-8 pb-[2px] cursor-pointer hover:bg-gray-ec overflow-hidden"
                key={e}
                onClick={() => handleSelect(e)}
              >
                {e}
              </div>
            ))}
          </div>
        </div>
        {emojis.map((c, i) => (
          <div
            key={c.id}
            ref={(ref) => { if (ref) { runInAction(() => { state.categoryBoxes[i + 1] = ref; }); } }}
          >
            <div className="pl-1 py-px mt-1 text-16 font-bold">
              {lang[c.id]}
            </div>
            <div className="grid text-20 justify-center w-[324px] select-none">
              {c.emojis.map((e) => (
                <div
                  className="flex flex-center w-8 h-8 pb-[2px] cursor-pointer hover:bg-gray-ec overflow-hidden"
                  key={e}
                  onClick={() => handleSelect(e)}
                >
                  {e}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Popover>
    <style jsx>{`
      .grid {
        grid-template-columns: repeat(auto-fill, 36px);
      }
    `}</style>
  </>);
});