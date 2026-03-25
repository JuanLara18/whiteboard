// src/components/boards/BoardList.tsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { ChangeEvent, DragEvent, KeyboardEvent, MouseEvent } from 'react';
import { spacing, layout, colors, borderRadius } from '../../styles/design-system';
import { StyledModal, StyledInput, StyledButton } from '../ui/StyledComponents';
import { useBoardStore, type Board, type BoardFolder } from '../../store/boardStore';
import { BOARD_TEMPLATES } from '../../constants/boardTemplates';
import { TemplatePreview } from './TemplatePreview';
import {
  IconPencil, IconX, IconChevronLeft, IconChevronRight, IconPlus,
  IconChevronDown, IconFolder, IconGripVertical,
} from '../ui/Icons';

// ── Sidebar-specific tokens ───────────────────────────────────────────────────
const SB = {
  bg:            layout.sidebar.backgroundColor,
  border:        layout.sidebar.borderColor,
  text:          layout.sidebar.textColor,
  textMuted:     layout.sidebar.textSecondary,
  hover:         layout.sidebar.hoverColor,
  active:        layout.sidebar.activeColor,
};

const SIDEBAR_DEFAULT_W   = 220;
const SIDEBAR_COLLAPSED_PX = 52;
const SIDEBAR_MIN_W       = 168;
const SIDEBAR_MAX_W       = 440;

const LS_SIDEBAR_COLLAPSED = 'whiteboard-sidebar-collapsed';
const LS_SIDEBAR_WIDTH     = 'whiteboard-sidebar-width';

/** HTML5 drag payload (custom MIME + plain text fallback) */
const DND_BOARD = 'application/x-whiteboard-board-id';

// ── Sidebar button ────────────────────────────────────────────────────────────
interface SbBtnProps {
  onClick: (e?: MouseEvent) => void;
  children: React.ReactNode;
  variant?: 'primary' | 'ghost' | 'danger';
  size?: 'sm' | 'xs';
  title?: string;
  style?: React.CSSProperties;
}
const SbBtn: React.FC<SbBtnProps> = ({ onClick, children, variant = 'ghost', size = 'sm', title, style }) => {
  const [hover, setHover] = React.useState(false);
  const isPrimary = variant === 'primary';
  const isDanger  = variant === 'danger';

  return (
    <button
      title={title}
      type="button"
      onClick={(e) => onClick(e as MouseEvent)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display:         'inline-flex',
        alignItems:      'center',
        justifyContent:  'center',
        gap:             spacing[1],
        border:          'none',
        cursor:          'pointer',
        borderRadius:    borderRadius.md,
        fontSize:        size === 'xs' ? '11px' : '12px',
        fontWeight:      500,
        padding:         size === 'xs' ? `${spacing[1]} ${spacing[1.5]}` : `${spacing[1.5]} ${spacing[3]}`,
        transition:      '120ms',
        whiteSpace:      'nowrap',
        backgroundColor: isPrimary
          ? hover ? colors.primary[500] : colors.primary[600]
          : isDanger
            ? hover ? colors.error[700] : 'transparent'
            : hover ? SB.hover : 'transparent',
        color: isPrimary
          ? colors.white
          : isDanger
            ? hover ? colors.error[200] : colors.error[600]
            : SB.textMuted,
        ...style,
      }}
    >
      {children}
    </button>
  );
};

function readBoardIdFromDrag(e: DragEvent): string | null {
  const v = e.dataTransfer.getData(DND_BOARD) || e.dataTransfer.getData('text/plain');
  return v && v.startsWith('board:') ? v.slice('board:'.length) : v || null;
}

/** Drag handle: higher contrast on dark sidebar (dots read as control, not background noise). */
const BoardRowGrip: React.FC<{
  boardId: string;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
}> = ({ boardId, onDragStart, onDragEnd }) => {
  const [hover, setHover] = useState(false);
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, boardId)}
      onDragEnd={onDragEnd}
      onClick={(e) => e.stopPropagation()}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title="Drag ··· to move"
      style={{
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        width:           24,
        height:          26,
        flexShrink:      0,
        cursor:          'grab',
        color:           hover ? colors.gray[400] : colors.gray[500],
        backgroundColor: hover ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
        borderRadius:    borderRadius.md,
        touchAction:     'none' as const,
      }}
    >
      <IconGripVertical size={14} />
    </div>
  );
};

// ── Main BoardList ────────────────────────────────────────────────────────────
export const BoardList = () => {
  const {
    boards, folders, currentBoardId,
    selectBoard, createBoard, deleteBoard, renameBoard,
    createFolder, createFolderAndMoveBoard, renameFolder, deleteFolder, moveBoardToFolder,
  } = useBoardStore();

  const [newBoardName,     setNewBoardName]     = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(BOARD_TEMPLATES[0]);
  const [editingBoard,     setEditingBoard]     = useState<{ id: string; name: string } | null>(null);
  const [deletingBoard,    setDeletingBoard]    = useState<string | null>(null);
  const [isCreateOpen,     setIsCreateOpen]     = useState(false);
  const [isEditOpen,       setIsEditOpen]       = useState(false);
  const [isDeleteOpen,     setIsDeleteOpen]     = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarWidthExpanded, setSidebarWidthExpanded] = useState(SIDEBAR_DEFAULT_W);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const resizeRef = useRef({ startX: 0, startW: SIDEBAR_DEFAULT_W });

  const [folderExpanded, setFolderExpanded] = useState<Record<string, boolean>>({});
  const [newFolderName,  setNewFolderName]  = useState('');
  const [isFolderCreateOpen, setIsFolderCreateOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<BoardFolder | null>(null);
  const [isFolderEditOpen, setIsFolderEditOpen] = useState(false);
  const [deletingFolderId, setDeletingFolderId] = useState<string | null>(null);
  const [isFolderDeleteOpen, setIsFolderDeleteOpen] = useState(false);

  const [draggingBoardId, setDraggingBoardId] = useState<string | null>(null);
  const [dropHighlight,   setDropHighlight]   = useState<'general' | 'new-folder' | string | null>(null);

  const foldersSorted = useMemo(
    () => [...folders].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    [folders],
  );

  const isFolderOpen = (id: string) => folderExpanded[id] !== false;
  const toggleFolderOpen = (id: string) => {
    setFolderExpanded((p) => ({ ...p, [id]: p[id] !== false ? false : true }));
  };

  useEffect(() => {
    try {
      if (localStorage.getItem(LS_SIDEBAR_COLLAPSED) === '1') setSidebarCollapsed(true);
      const w = parseInt(localStorage.getItem(LS_SIDEBAR_WIDTH) || '', 10);
      if (!Number.isNaN(w) && w >= SIDEBAR_MIN_W && w <= SIDEBAR_MAX_W) setSidebarWidthExpanded(w);
    } catch { /* private mode */ }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LS_SIDEBAR_COLLAPSED, sidebarCollapsed ? '1' : '0');
    } catch { /* ignore */ }
  }, [sidebarCollapsed]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_SIDEBAR_WIDTH, String(sidebarWidthExpanded));
    } catch { /* ignore */ }
  }, [sidebarWidthExpanded]);

  const sidebarWidthPx = sidebarCollapsed ? SIDEBAR_COLLAPSED_PX : sidebarWidthExpanded;

  const onSidebarResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    resizeRef.current = { startX: e.clientX, startW: sidebarWidthExpanded };
    setIsResizingSidebar(true);
    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - resizeRef.current.startX;
      const next = Math.min(SIDEBAR_MAX_W, Math.max(SIDEBAR_MIN_W, resizeRef.current.startW + dx));
      setSidebarWidthExpanded(next);
    };
    const onUp = () => {
      setIsResizingSidebar(false);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [sidebarWidthExpanded]);

  const boardsAtRoot = useMemo(
    () => boards.filter((b) => !(b.folderId ?? null)),
    [boards],
  );

  const boardsInFolder = (fid: string) =>
    boards.filter((b) => (b.folderId ?? null) === fid);

  const endDrag = useCallback(() => {
    setDraggingBoardId(null);
    setDropHighlight(null);
  }, []);

  const handleDragStartBoard = useCallback((e: DragEvent, boardId: string) => {
    e.stopPropagation();
    const payload = `board:${boardId}`;
    e.dataTransfer.setData(DND_BOARD, boardId);
    e.dataTransfer.setData('text/plain', payload);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingBoardId(boardId);
  }, []);

  const handleDragOverZone = useCallback((e: DragEvent, zone: 'general' | 'new-folder' | string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropHighlight(zone);
  }, []);

  const handleDropGeneral = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const boardId = readBoardIdFromDrag(e);
    if (boardId) moveBoardToFolder(boardId, null);
    endDrag();
  }, [moveBoardToFolder, endDrag]);

  const handleDropFolder = useCallback((e: DragEvent, folderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const boardId = readBoardIdFromDrag(e);
    if (boardId) {
      moveBoardToFolder(boardId, folderId);
      setFolderExpanded((p) => ({ ...p, [folderId]: true }));
    }
    endDrag();
  }, [moveBoardToFolder, endDrag]);

  const handleDropNewFolder = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const boardId = readBoardIdFromDrag(e);
    if (boardId) {
      createFolderAndMoveBoard(boardId);
      const fid = useBoardStore.getState().boards.find((b) => b.id === boardId)?.folderId ?? null;
      if (fid) setFolderExpanded((p) => ({ ...p, [fid]: true }));
    }
    endDrag();
  }, [createFolderAndMoveBoard, endDrag]);

  const dropShell = (active: boolean): React.CSSProperties => ({
    borderRadius:    borderRadius.md,
    border:          `1.5px dashed ${active ? colors.primary[400] : colors.gray[700]}`,
    backgroundColor: active ? 'rgba(99,102,241,0.14)' : 'transparent',
    transition:      'border-color 120ms, background-color 120ms',
  });

  const openCreateBoardModal = () => setIsCreateOpen(true);

  const handleCreateBoard = () => {
    if (!newBoardName.trim()) return;
    createBoard(newBoardName.trim(), selectedTemplate, null);
    setNewBoardName('');
    setSelectedTemplate(BOARD_TEMPLATES[0]);
    setIsCreateOpen(false);
  };

  const handleSaveEdit = () => {
    if (!editingBoard?.name.trim()) return;
    renameBoard(editingBoard.id, editingBoard.name.trim());
    setEditingBoard(null);
    setIsEditOpen(false);
  };

  const confirmDelete = () => {
    if (!deletingBoard) return;
    deleteBoard(deletingBoard);
    setDeletingBoard(null);
    setIsDeleteOpen(false);
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    createFolder(newFolderName.trim());
    setNewFolderName('');
    setIsFolderCreateOpen(false);
  };

  const handleSaveFolderEdit = () => {
    if (!editingFolder?.name.trim()) return;
    renameFolder(editingFolder.id, editingFolder.name.trim());
    setEditingFolder(null);
    setIsFolderEditOpen(false);
  };

  const confirmDeleteFolder = () => {
    if (!deletingFolderId) return;
    deleteFolder(deletingFolderId);
    setDeletingFolderId(null);
    setIsFolderDeleteOpen(false);
  };

  const outerSidebarStyle: React.CSSProperties = {
    position:     'relative',
    flexShrink:   0,
    height:       '100vh',
    width:        sidebarWidthPx,
    minWidth:     sidebarWidthPx,
    transition:   isResizingSidebar || sidebarCollapsed ? undefined : 'width 160ms ease, min-width 160ms ease',
  };

  const sidebarStyle: React.CSSProperties = {
    height:          '100%',
    width:           '100%',
    boxSizing:       'border-box',
    backgroundColor: SB.bg,
    borderRight:     `1px solid ${SB.border}`,
    display:         'flex',
    flexDirection:   'column',
    overflow:        'hidden',
  };

  const collapseBtnStyle = (hover: boolean): React.CSSProperties => ({
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    width:           32,
    height:          32,
    padding:         0,
    border:          'none',
    borderRadius:    borderRadius.md,
    cursor:          'pointer',
    flexShrink:      0,
    backgroundColor: hover ? SB.hover : 'transparent',
    color:           SB.textMuted,
    transition:      '120ms',
  });

  const CollapseToggle = () => {
    const [h, setH] = useState(false);
    return (
      <button
        type="button"
        aria-expanded={!sidebarCollapsed}
        aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        onClick={() => setSidebarCollapsed((c) => !c)}
        onMouseEnter={() => setH(true)}
        onMouseLeave={() => setH(false)}
        style={collapseBtnStyle(h)}
      >
        {sidebarCollapsed ? <IconChevronRight size={18} /> : <IconChevronLeft size={18} />}
      </button>
    );
  };

  const renderBoardRow = (board: Board) => {
    const isActive = currentBoardId === board.id;
    const dim = draggingBoardId === board.id;
    return (
      <div
        key={board.id}
        onClick={() => selectBoard(board.id)}
        style={{
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'space-between',
          gap:             spacing[1],
          padding:         `${spacing[2]} ${spacing[2]} ${spacing[2]} ${spacing[1]}`,
          borderRadius:    borderRadius.md,
          cursor:          'pointer',
          marginBottom:    spacing[0.5],
          backgroundColor: isActive ? SB.active : 'transparent',
          transition:      '120ms',
          border:          isActive ? `1px solid ${colors.gray[700]}` : '1px solid transparent',
          opacity:         dim ? 0.45 : 1,
        }}
        onMouseEnter={(e) => {
          if (!isActive) (e.currentTarget as HTMLDivElement).style.backgroundColor = SB.hover;
        }}
        onMouseLeave={(e) => {
          if (!isActive) (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
        }}
      >
        <BoardRowGrip boardId={board.id} onDragStart={handleDragStartBoard} onDragEnd={endDrag} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize:     '13px',
            fontWeight:   isActive ? 600 : 400,
            color:        isActive ? colors.gray[50] : SB.textMuted,
            overflow:     'hidden',
            textOverflow: 'ellipsis',
            whiteSpace:   'nowrap',
            margin:       0,
          }}>
            {board.name}
          </p>
        </div>

        <div
          style={{ display: 'flex', gap: spacing[0.5], opacity: isActive ? 1 : 0 }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = '1'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = isActive ? '1' : '0'; }}
        >
          <SbBtn
            size="xs"
            onClick={(e?: MouseEvent) => { e?.stopPropagation(); setEditingBoard({ id: board.id, name: board.name }); setIsEditOpen(true); }}
            title="Rename board"
          >
            <IconPencil size={14} />
          </SbBtn>
          <SbBtn
            size="xs"
            variant="danger"
            onClick={(e?: MouseEvent) => { e?.stopPropagation(); setDeletingBoard(board.id); setIsDeleteOpen(true); }}
            title="Delete board"
          >
            <IconX size={14} />
          </SbBtn>
        </div>
      </div>
    );
  };

  const listEmpty = boards.length === 0 && foldersSorted.length === 0;
  const showDragHint = boards.length > 0;

  return (
    <div style={outerSidebarStyle}>
    <div style={sidebarStyle} onDragEnd={endDrag}>
      {sidebarCollapsed ? (
        <div style={{
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'center',
          gap:            spacing[2],
          padding:        `${spacing[2]} ${spacing[1]}`,
          borderBottom:   `1px solid ${SB.border}`,
          flexShrink:     0,
        }}>
          <CollapseToggle />
          <SbBtn
            variant="primary"
            size="sm"
            onClick={openCreateBoardModal}
            title="New board"
            style={{ width: 36, height: 36, padding: 0, minWidth: 36 }}
          >
            <IconPlus size={18} />
          </SbBtn>
        </div>
      ) : (
        <div style={{
          display:         'flex',
          alignItems:      'center',
          flexWrap:        'wrap',
          gap:             spacing[1],
          padding:         `${spacing[3]} ${spacing[2]} ${spacing[3]} ${spacing[3]}`,
          borderBottom:    `1px solid ${SB.border}`,
          flexShrink:      0,
        }}>
          <CollapseToggle />
          <span style={{
            flex:           '1 1 60px',
            minWidth:       0,
            fontSize:     '13px',
            fontWeight:   600,
            color:        SB.textMuted,
            letterSpacing: '0.06em',
            textTransform: 'uppercase' as const,
          }}>
            Boards
          </span>
          <SbBtn size="sm" onClick={() => setIsFolderCreateOpen(true)} title="Empty folder">
            <IconFolder size={15} />
          </SbBtn>
          <SbBtn variant="primary" size="sm" onClick={openCreateBoardModal} title="Create new board">
            New
          </SbBtn>
        </div>
      )}

      {!sidebarCollapsed && (
      <div className="sidebar-scroll" style={{ flex: 1, overflowY: 'auto', padding: spacing[2] }}>
        {listEmpty ? (
          <p style={{
            padding: `${spacing[6]} ${spacing[3]}`,
            margin: 0,
            textAlign: 'center',
            fontSize: '12px',
            color: SB.textMuted,
            lineHeight: 1.5,
          }}>
            No boards
          </p>
        ) : (
          <>
            {/* General (no folder) — always a drop target when any boards or folders exist */}
            {(boards.length > 0 || foldersSorted.length > 0) && (
              <div
                onDragOver={(e) => handleDragOverZone(e, 'general')}
                onDrop={handleDropGeneral}
                style={{
                  ...dropShell(dropHighlight === 'general'),
                  marginBottom: spacing[2],
                  padding:      spacing[1],
                  minHeight:    boardsAtRoot.length === 0 && foldersSorted.length > 0 ? 36 : undefined,
                }}
              >
                {foldersSorted.length > 0 && (
                  <p style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: colors.gray[500],
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase' as const,
                    margin: `0 0 ${spacing[1]} ${spacing[1]}`,
                  }}>
                    General
                  </p>
                )}
                {boardsAtRoot.length === 0 && foldersSorted.length > 0 && (
                  <p style={{
                    fontSize: 10,
                    color: colors.gray[600],
                    margin: `${spacing[1]} ${spacing[1]}`,
                    lineHeight: 1.35,
                    whiteSpace: 'nowrap' as const,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    Drop here → General
                  </p>
                )}
                {boardsAtRoot.map(renderBoardRow)}
              </div>
            )}

            {foldersSorted.map((folder) => {
              const inner = boardsInFolder(folder.id);
              const open = isFolderOpen(folder.id);
              const hl = dropHighlight === folder.id;
              return (
                <div
                  key={folder.id}
                  onDragOver={(e) => handleDragOverZone(e, folder.id)}
                  onDrop={(e) => handleDropFolder(e, folder.id)}
                  style={{
                    ...dropShell(hl),
                    marginBottom: spacing[2],
                    padding:      spacing[1],
                  }}
                >
                  <div
                    style={{
                      display:        'flex',
                      alignItems:     'center',
                      gap:            spacing[1],
                      padding:        `${spacing[1]} ${spacing[1]}`,
                      borderRadius:   borderRadius.sm,
                      cursor:         'pointer',
                      marginBottom:   open && inner.length > 0 ? spacing[0.5] : 0,
                    }}
                    onClick={() => toggleFolderOpen(folder.id)}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(255,255,255,0.04)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent'; }}
                  >
                    <span style={{
                      display:      'flex',
                      alignItems:   'center',
                      color:        SB.textMuted,
                      transform:    open ? 'rotate(0deg)' : 'rotate(-90deg)',
                      transition:   '120ms',
                    }}>
                      <IconChevronDown size={14} />
                    </span>
                    <IconFolder size={15} />
                    <span style={{
                      flex:         1,
                      minWidth:     0,
                      fontSize:     '12px',
                      fontWeight:   600,
                      color:        colors.gray[200],
                      overflow:     'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace:   'nowrap',
                    }}>
                      {folder.name}
                    </span>
                    <div style={{ display: 'flex', gap: spacing[0.5] }} onClick={(e) => e.stopPropagation()}>
                      <SbBtn
                        size="xs"
                        onClick={() => { setEditingFolder(folder); setIsFolderEditOpen(true); }}
                        title="Rename folder"
                      >
                        <IconPencil size={14} />
                      </SbBtn>
                      <SbBtn
                        size="xs"
                        variant="danger"
                        onClick={() => { setDeletingFolderId(folder.id); setIsFolderDeleteOpen(true); }}
                        title="Delete folder"
                      >
                        <IconX size={14} />
                      </SbBtn>
                    </div>
                  </div>
                  {open && inner.map(renderBoardRow)}
                  {open && inner.length === 0 && (
                    <p style={{
                      fontSize: 10,
                      color: colors.gray[600],
                      margin: `${spacing[1]} ${spacing[1]}`,
                      lineHeight: 1.35,
                      whiteSpace: 'nowrap' as const,
                    }}>
                      Drop here
                    </p>
                  )}
                </div>
              );
            })}

            {showDragHint && (
              <div
                onDragOver={(e) => handleDragOverZone(e, 'new-folder')}
                onDrop={handleDropNewFolder}
                style={{
                  ...dropShell(dropHighlight === 'new-folder'),
                  padding:     `${spacing[3]} ${spacing[2]}`,
                  textAlign:   'center',
                }}
              >
                <p style={{
                  fontSize: 10,
                  fontWeight: 500,
                  color: colors.gray[400],
                  margin: 0,
                  lineHeight: 1.35,
                  whiteSpace: 'nowrap' as const,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  Drop → new folder
                </p>
              </div>
            )}
          </>
        )}
      </div>
      )}

      {!sidebarCollapsed && (
      <div style={{
        padding:      `${spacing[3]} ${spacing[4]}`,
        borderTop:    `1px solid ${SB.border}`,
        flexShrink:   0,
      }}>
        <p style={{
          fontSize: '10px',
          color: colors.gray[600],
          lineHeight: 1.35,
          margin: 0,
          whiteSpace: 'nowrap' as const,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
        title={showDragHint ? '··· drag to organize · Space+drag pan · wheel zoom' : 'Space+drag pan · wheel zoom'}
        >
          {showDragHint ? '··· organize · Space pan · wheel zoom' : 'Space pan · wheel zoom'}
        </p>
      </div>
      )}

      {/* Create board */}
      <StyledModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="New board"
        footer={
          <div style={{ display: 'flex', gap: spacing[2] }}>
            <StyledButton variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancel</StyledButton>
            <StyledButton variant="primary" onClick={handleCreateBoard} disabled={!newBoardName.trim()}>
              Create
            </StyledButton>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[4] }}>
          <StyledInput
            label="Board name"
            placeholder="Untitled board"
            value={newBoardName}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setNewBoardName(e.target.value)}
            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleCreateBoard()}
            autoFocus
          />
          <p style={{ fontSize: 11, color: colors.gray[500], margin: 0, lineHeight: 1.45 }}>
            In General first. ··· into a folder; bottom dashed strip = new folder.
          </p>
          <div>
            <p style={{ fontSize: '12px', fontWeight: 500, color: colors.gray[600], marginBottom: spacing[3] }}>
              Background template
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(72px,1fr))', gap: spacing[2] }}>
              {BOARD_TEMPLATES.map((t) => (
                <div key={t.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: spacing[1.5] }}>
                  <TemplatePreview template={t} size="medium" selected={selectedTemplate.id === t.id} onClick={() => setSelectedTemplate(t)} />
                  <span style={{ fontSize: '10px', color: colors.gray[500], textAlign: 'center' }}>{t.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </StyledModal>

      {/* Rename board */}
      <StyledModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Rename board"
        footer={
          <div style={{ display: 'flex', gap: spacing[2] }}>
            <StyledButton variant="ghost" onClick={() => setIsEditOpen(false)}>Cancel</StyledButton>
            <StyledButton variant="primary" onClick={handleSaveEdit} disabled={!editingBoard?.name.trim()}>
              Save
            </StyledButton>
          </div>
        }
      >
        <StyledInput
          label="Board name"
          placeholder="Untitled board"
          value={editingBoard?.name ?? ''}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setEditingBoard((prev) => prev ? { ...prev, name: e.target.value } : null)
          }
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleSaveEdit()}
          autoFocus
        />
      </StyledModal>

      {/* Delete board */}
      <StyledModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete board?"
        footer={
          <div style={{ display: 'flex', gap: spacing[2] }}>
            <StyledButton variant="ghost" onClick={() => setIsDeleteOpen(false)}>Cancel</StyledButton>
            <StyledButton variant="danger" onClick={confirmDelete}>Delete</StyledButton>
          </div>
        }
      >
        <p style={{ fontSize: '14px', color: colors.gray[600], lineHeight: 1.6, margin: 0 }}>
          This will permanently delete the board and all its content. This action cannot be undone.
        </p>
      </StyledModal>

      {/* New folder (empty) */}
      <StyledModal
        isOpen={isFolderCreateOpen}
        onClose={() => setIsFolderCreateOpen(false)}
        title="New folder"
        footer={
          <div style={{ display: 'flex', gap: spacing[2] }}>
            <StyledButton variant="ghost" onClick={() => setIsFolderCreateOpen(false)}>Cancel</StyledButton>
            <StyledButton variant="primary" onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
              Create
            </StyledButton>
          </div>
        }
      >
        <StyledInput
          label="Folder name"
          placeholder="e.g. Work, Ideas"
          value={newFolderName}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setNewFolderName(e.target.value)}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleCreateFolder()}
          autoFocus
        />
        <p style={{ fontSize: 11, color: colors.gray[500], marginTop: spacing[3], marginBottom: 0, lineHeight: 1.45 }}>
          Drag ··· from General into this folder.
        </p>
      </StyledModal>

      {/* Rename folder */}
      <StyledModal
        isOpen={isFolderEditOpen}
        onClose={() => setIsFolderEditOpen(false)}
        title="Rename folder"
        footer={
          <div style={{ display: 'flex', gap: spacing[2] }}>
            <StyledButton variant="ghost" onClick={() => setIsFolderEditOpen(false)}>Cancel</StyledButton>
            <StyledButton variant="primary" onClick={handleSaveFolderEdit} disabled={!editingFolder?.name.trim()}>
              Save
            </StyledButton>
          </div>
        }
      >
        <StyledInput
          label="Folder name"
          placeholder="Folder name"
          value={editingFolder?.name ?? ''}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setEditingFolder((prev) => prev ? { ...prev, name: e.target.value } : null)
          }
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleSaveFolderEdit()}
          autoFocus
        />
      </StyledModal>

      {/* Delete folder */}
      <StyledModal
        isOpen={isFolderDeleteOpen}
        onClose={() => setIsFolderDeleteOpen(false)}
        title="Delete folder?"
        footer={
          <div style={{ display: 'flex', gap: spacing[2] }}>
            <StyledButton variant="ghost" onClick={() => setIsFolderDeleteOpen(false)}>Cancel</StyledButton>
            <StyledButton variant="danger" onClick={confirmDeleteFolder}>Delete</StyledButton>
          </div>
        }
      >
        <p style={{ fontSize: '14px', color: colors.gray[600], lineHeight: 1.6, margin: 0 }}>
          Boards return to General; folder is removed.
        </p>
      </StyledModal>
    </div>

    {!sidebarCollapsed && (
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize sidebar"
        title="Drag to resize"
        onMouseDown={onSidebarResizeStart}
        style={{
          position:        'absolute',
          top:             0,
          right:           0,
          width:           6,
          marginRight:     -3,
          height:          '100%',
          cursor:          'col-resize',
          zIndex:          6,
          backgroundColor: 'transparent',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(255,255,255,0.08)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent'; }}
      />
    )}
    </div>
  );
};
