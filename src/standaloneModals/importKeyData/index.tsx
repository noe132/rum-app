import path from 'path';
import React from 'react';
import classNames from 'classnames';
import { createRoot } from 'react-dom/client';
import { format } from 'date-fns';
import fs from 'fs/promises';
import { ipcRenderer } from 'electron';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { action, runInAction } from 'mobx';
import { FormControl, FormControlLabel, Radio, RadioGroup, Tooltip } from '@mui/material';
import { MdDone } from 'react-icons/md';
import PasswordInput from 'components/PasswordInput';

import Dialog from 'components/Dialog';
import Button from 'components/Button';
import { StoreProvider, useStore } from 'store';
import { ThemeRoot } from 'utils/theme';
import { lang } from 'utils/lang';
import formatPath from 'utils/formatPath';
import * as Quorum from 'utils/quorum';

export const importKeyData = async () => new Promise<void>((rs) => {
  const div = document.createElement('div');
  document.body.append(div);
  const root = createRoot(div);
  const unmount = () => {
    root.unmount();
    div.remove();
  };
  root.render(
    <ThemeRoot>
      <StoreProvider>
        <ImportKeyData
          rs={() => {
            rs();
            setTimeout(unmount, 3000);
          }}
        />
      </StoreProvider>
    </ThemeRoot>,
  );
});

interface Props {
  rs: () => unknown
}

enum STEP {
  SELECT_MODE = 1,
  SELECT_BACKUP = 2,
  SELECT_FOLDER = 3,
  INPUT_PASSWORD = 4,
}

const ImportKeyData = observer((props: Props) => {
  const state = useLocalObservable(() => ({
    mode: 'native',
    step: STEP.SELECT_MODE,
    open: false,
    loading: false,
    done: false,
    loadingKeyData: false,
    backupPath: null as any,
    backupFileContent: '',
    password: '',
    storagePath: '',
  }));
  const { snackbarStore } = useStore();

  const submit = async () => {
    if (state.loading) { return; }
    if (state.step < STEP.INPUT_PASSWORD) {
      runInAction(() => { state.step += 1; });
      return;
    }
    if (state.step === STEP.INPUT_PASSWORD) {
      runInAction(() => {
        state.loading = true;
        state.done = false;
      });
      try {
        const { error } = await Quorum.importKey({
          backupPath: state.backupPath,
          storagePath: state.storagePath,
          password: state.password,
        });
        if (!error) {
          runInAction(() => {
            state.done = true;
          });
          snackbarStore.show({
            message: lang.importKeyDataDone,
          });
          handleClose();
          return;
        }
        if (error.includes('Failed to read backup file')) {
          snackbarStore.show({
            message: lang.failedToReadBackipFile,
            type: 'error',
          });
          return;
        }
        if (error.includes('not a valid zip file')) {
          snackbarStore.show({
            message: lang.notAValidZipFile,
            type: 'error',
          });
          return;
        }
        if (error.includes('is not empty')) {
          snackbarStore.show({
            message: lang.isNotEmpty,
            type: 'error',
          });
          return;
        }
        if (error.includes('incorrect passphrase')) {
          snackbarStore.show({
            message: lang.incorrectPassword,
            type: 'error',
          });
          return;
        }
        if (error.includes('permission denied')) {
          snackbarStore.show({
            message: lang.writePermissionDenied,
            type: 'error',
          });
          return;
        }
        snackbarStore.show({
          message: lang.somethingWrong,
          type: 'error',
        });
      } catch (err: any) {
        console.error(err);
        snackbarStore.show({
          message: lang.somethingWrong,
          type: 'error',
        });
      } finally {
        runInAction(() => {
          state.loading = false;
        });
      }
    }
  };

  const handleSelectBackup = async () => {
    runInAction(() => {
      state.loadingKeyData = true;
    });
    try {
      const file = state.mode === 'native'
        ? await ipcRenderer.invoke('open-dialog', {
          filters: [{ name: 'enc', extensions: ['enc'] }],
          properties: ['openFile'],
        })
        : await ipcRenderer.invoke('open-dialog', {
          filters: [{ name: 'backup.json', extensions: ['json'] }],
          properties: ['openFile'],
        });
      if (!file.canceled && file.filePaths) {
        runInAction(() => {
          state.backupPath = file.filePaths[0].toString();
        });
      }
    } catch (err) {
      console.error(err);
    }
    runInAction(() => {
      state.loadingKeyData = false;
    });
  };

  const handleSelectDir = async () => {
    const isRumFolder = (p: string) => {
      const folderName = path.basename(p);
      return /^rum(-.+)?$/.test(folderName);
    };
    const isEmptyFolder = async (p: string) => {
      const exist = await (async () => {
        try {
          const stat = await fs.stat(p);
          return { right: stat };
        } catch (e) {
          return { left: e as NodeJS.ErrnoException };
        }
      })();
      const files = await (async () => {
        try {
          const f = await fs.readdir(p);
          return { right: f };
        } catch (e) {
          return { left: e as NodeJS.ErrnoException };
        }
      })();
      const notExist = !!exist.left && exist.left.code === 'ENOENT';
      const isEmpty = !!files.right && !files.right.length;
      return notExist || isEmpty;
    };

    const selectePath = async () => {
      const file = await ipcRenderer.invoke('open-dialog', {
        properties: ['openDirectory'],
      });
      const p = file.filePaths[0];
      if (file.canceled || !file.filePaths.length || state.storagePath === p) {
        return null;
      }
      return p;
    };

    const selectedPath = await selectePath();
    if (!selectedPath) {
      return;
    }

    const date = format(new Date(), 'yyyyMMdd');
    const paths = [
      selectedPath,
      path.join(selectedPath, 'rum'),
      path.join(selectedPath, `rum-${date}`),
    ];

    for (const p of paths) {
      if (isRumFolder(p) && await isEmptyFolder(p)) {
        runInAction(() => {
          state.storagePath = p;
        });
        return;
      }
    }

    const files = await fs.readdir(selectedPath);
    // find the max index in `rum-${date}-${index}`
    const maxIndex = files
      .map((v) => new RegExp(`rum-${date}-(\\d+?)$`).exec(v))
      .filter(<T extends unknown>(v: T | null): v is T => !!v)
      .map((v) => Number(v[1]))
      .reduce((p, c) => Math.max(p, c), 0);
    const newPath = path.join(selectedPath, `rum-${date}-${maxIndex + 1}`);
    await fs.mkdir(newPath, { recursive: true });
    runInAction(() => {
      state.storagePath = newPath;
    });
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      (e.target as HTMLInputElement).blur();
      submit();
    }
  };

  const handleClose = action(() => {
    state.open = false;
    props.rs();
  });

  const selectedBackupFile = !!state.backupPath || !!state.backupFileContent;

  React.useEffect(() => {
    runInAction(() => {
      state.open = true;
    });
  }, []);

  return (
    <Dialog
      disableEscapeKeyDown
      open={state.open}
      transitionDuration={300}
      onClose={(...args) => {
        if (state.loading || args[1] === 'backdropClick') {
          return;
        }
        handleClose();
      }}
    >
      <div className="w-100 bg-white rounded-12 text-center px-8 pt-12 pb-8">
        <div>
          {state.step === STEP.SELECT_MODE && (<>
            <div className="text-16 font-bold text-gray-4a">
              {lang.selectImportMode}
            </div>
            <div className="mt-4">
              <FormControl>
                <RadioGroup
                  defaultValue="native"
                  value={state.mode}
                  onChange={action((_, v) => { state.mode = v as any; })}
                >
                  <FormControlLabel
                    className="select-none"
                    value="native"
                    control={<Radio />}
                    label={lang.importForRumApp}
                  />
                </RadioGroup>
              </FormControl>

              <Button
                className="rounded min-w-[160px] h-10 mt-4"
                size="x-large"
                onClick={submit}
              >
                {lang.yes}
              </Button>
            </div>
          </>)}
          {state.step === STEP.SELECT_BACKUP && (<>
            <div className="text-16 font-bold text-gray-4a">{lang.importKey}</div>
            <Tooltip
              disableHoverListener={selectedBackupFile}
              placement="top"
              title={lang.selectKeyBackupToImport}
              arrow
              disableInteractive
            >
              <div className="mt-6">
                <Button
                  className="rounded min-w-[160px] h-10"
                  size="x-large"
                  color={selectedBackupFile ? 'green' : 'primary'}
                  isDoing={state.loadingKeyData}
                  onClick={handleSelectBackup}
                >
                  {selectedBackupFile ? lang.selectedKeyBackupFile : lang.selectKeyBackupFile}
                  {selectedBackupFile && <MdDone className="ml-1 text-15" />}
                </Button>
              </div>
            </Tooltip>
            <div className="mt-6">
              <Button
                className="rounded min-w-[160px] h-10"
                size="x-large"
                disabled={!selectedBackupFile}
                onClick={submit}
              >
                {lang.yes}
              </Button>
            </div>
          </>)}
          {state.step === STEP.SELECT_FOLDER && (<>
            <div className="text-16 font-bold text-gray-4a">{ lang.selectFolder }</div>
            <div className="mt-6 text-gray-9b tracking-wide leading-loose">
              { lang.storagePathTip2 }
            </div>
            <div className="mt-6 mb-4 pt-[2px]">
              {!state.storagePath && (
                <Button
                  className="rounded min-w-[160px] h-10"
                  size="x-large"
                  onClick={handleSelectDir}
                >
                  {lang.selectFolder}
                </Button>
              )}

              {state.storagePath && (<>
                <div className="flex">
                  <div className="text-left p-2 pl-3 border border-gray-200 text-gray-500 bg-gray-100 text-12 truncate flex-1 border-r-0">
                    <Tooltip placement="top" title={state.storagePath} arrow>
                      <div className="tracking-wide">
                        {formatPath(state.storagePath, { truncateLength: 19 })}
                      </div>
                    </Tooltip>
                  </div>
                  <Button
                    className="rounded-r-12 opacity-60"
                    size="small"
                    onClick={handleSelectDir}
                  >
                    {lang.edit}
                  </Button>
                </div>
                <div className="mt-6">
                  <Button
                    className="rounded min-w-[160px] h-10"
                    size="x-large"
                    isDoing={state.loading}
                    isDone={state.done}
                    onClick={submit}
                  >
                    {lang.yes}
                  </Button>
                </div>
              </>)}
            </div>
          </>)}
          {state.step === STEP.INPUT_PASSWORD && (<>
            <div className="text-16 font-bold text-gray-4a">{ lang.enterPassword }</div>
            <div className="mt-6">
              <PasswordInput
                className="w-full"
                placeholder={lang.password}
                size="small"
                value={state.password}
                onChange={action((e) => { state.password = e.target.value; })}
                onKeyDown={handleInputKeyDown}
                margin="dense"
                variant="outlined"
                type="password"
              />
            </div>
            <div className="mt-6 mb-4 pt-[2px]">
              <Button
                className="rounded min-w-[160px] h-10"
                size="x-large"
                disabled={!state.password}
                isDoing={state.loading}
                isDone={state.done}
                onClick={submit}
              >
                {lang.yes}
              </Button>
            </div>
          </>)}
          {state.step > 1 && (
            <div className="my-4">
              <span
                className={classNames(
                  'mt-5 text-link-blue text-14',
                  state.loading ? 'cursor-not-allowed' : 'cursor-pointer',
                )}
                onClick={() => {
                  if (state.loading) {
                    return;
                  }
                  runInAction(() => {
                    state.step = state.step > 1 ? state.step - 1 : 1;
                  });
                }}
              >
                {lang.backOneStep}
              </span>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
});

export interface BackupFile {
  keystore: Array<string>
  seeds: Array<{
    genesis_block: {
      BlockId: string
      GroupId: string
      ProducerPubKey: string
      Hash: string
      Signature: string
      TimeStamp: string
    }
    group_id: string
    group_name: string
    owner_pubkey: string
    consensus_type: string
    encryption_type: string
    cipher_key: string
    app_key: string
    signature: string
  }>
}
