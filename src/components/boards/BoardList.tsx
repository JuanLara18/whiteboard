// src/components/boards/BoardList.tsx
import React, { useState, useEffect } from 'react';
import type { ChangeEvent, KeyboardEvent, MouseEvent } from 'react';
import { spacing, layout, colors, borderRadius } from '../../styles/design-system';
import { StyledModal, StyledInput, StyledButton } from '../ui/StyledComponents';
import { useBoardStore } from '../../store/boardStore';
import { BOARD_TEMPLATES } from '../../constants/boardTemplates';
import { TemplatePreview } from './TemplatePreview';
import { IconPencil, IconX, IconChevronLeft, IconChevronRight, IconPlus } from '../ui/Icons';

// ── Sidebar-specific tokens ───────────────────────────────────────────────────
const SB = {
  bg:            layout.sidebar.backgroundColor,
  border:        layout.sidebar.borderColor,
  text:          layout.sidebar.textColor,
  textMuted:     layout.sidebar.textSecondary,
  hover:         layout.sidebar.hoverColor,
  active:        layout.sidebar.activeColor,
  width:         layout.sidebar.width,
};

const SIDEBAR_EXPANDED_PX = 220;
const SIDEBAR_COLLAPSED_PX = 52;

const LS_SIDEBAR_COLLAPSED = 'whiteboard-sidebar-collapsed';

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

// ── Main BoardList ────────────────────────────────────────────────────────────
export const BoardList = () => {
  const { boards, currentBoardId, selectBoard, createBoard, deleteBoard, renameBoard } = useBoardStore();

  const [newBoardName,    setNewBoardName]    = useState('');
  const [selectedTemplate,setSelectedTemplate]= useState(BOARD_TEMPLATES[0]);
  const [editingBoard,    setEditingBoard]    = useState<{ id: string; name: string } | null>(null);
  const [deletingBoard,   setDeletingBoard]   = useState<string | null>(null);
  const [isCreateOpen,    setIsCreateOpen]    = useState(false);
  const [isEditOpen,      setIsEditOpen]      = useState(false);
  const [isDeleteOpen,    setIsDeleteOpen]    = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(LS_SIDEBAR_COLLAPSED) === '1') setSidebarCollapsed(true);
    } catch { /* private mode */ }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LS_SIDEBAR_COLLAPSED, sidebarCollapsed ? '1' : '0');
    } catch { /* ignore */ }
  }, [sidebarCollapsed]);

  const sidebarWidthPx = sidebarCollapsed ? SIDEBAR_COLLAPSED_PX : SIDEBAR_EXPANDED_PX;

  const handleCreateBoard = async () => {
    if (!newBoardName.trim()) return;
    await createBoard(newBoardName.trim(), selectedTemplate);
    setNewBoardName('');
    setSelectedTemplate(BOARD_TEMPLATES[0]);
    setIsCreateOpen(false);
  };

  const handleSaveEdit = async () => {
    if (!editingBoard?.name.trim()) return;
    await renameBoard(editingBoard.id, editingBoard.name.trim());
    setEditingBoard(null);
    setIsEditOpen(false);
  };

  const confirmDelete = async () => {
    if (!deletingBoard) return;
    await deleteBoard(deletingBoard);
    setDeletingBoard(null);
    setIsDeleteOpen(false);
  };

  const sidebarStyle: React.CSSProperties = {
    height:          '100vh',
    width:           `${sidebarWidthPx}px`,
    minWidth:        `${sidebarWidthPx}px`,
    backgroundColor: SB.bg,
    borderRight:     `1px solid ${SB.border}`,
    display:         'flex',
    flexDirection:   'column',
    overflow:        'hidden',
    flexShrink:      0,
    transition:      'width 200ms ease, min-width 200ms ease',
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

  return (
    <div style={sidebarStyle}>
      {/* Header */}
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
            onClick={() => setIsCreateOpen(true)}
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
          gap:             spacing[1],
          padding:         `${spacing[3]} ${spacing[2]} ${spacing[3]} ${spacing[3]}`,
          borderBottom:    `1px solid ${SB.border}`,
          flexShrink:      0,
        }}>
          <CollapseToggle />
          <span style={{
            flex:           1,
            minWidth:       0,
            fontSize:     '13px',
            fontWeight:   600,
            color:        SB.textMuted,
            letterSpacing: '0.06em',
            textTransform: 'uppercase' as const,
          }}>
            Boards
          </span>
          <SbBtn variant="primary" size="sm" onClick={() => setIsCreateOpen(true)} title="Create new board">
            New
          </SbBtn>
        </div>
      )}

      {/* Board list */}
      {!sidebarCollapsed && (
      <div className="sidebar-scroll" style={{ flex: 1, overflowY: 'auto', padding: spacing[2] }}>
        {boards.length === 0 ? (
          <p style={{
            padding: `${spacing[6]} ${spacing[3]}`,
            margin: 0,
            textAlign: 'center',
            fontSize: '12px',
            color: SB.textMuted,
            lineHeight: 1.5,
          }}>
            No boards yet
          </p>
        ) : (
          boards.map((board: { id: string; name: string; elements: any[] }) => {
            const isActive = currentBoardId === board.id;
            return (
              <div
                key={board.id}
                onClick={() => selectBoard(board.id)}
                style={{
                  display:         'flex',
                  alignItems:      'center',
                  justifyContent:  'space-between',
                  padding:         `${spacing[2]} ${spacing[3]}`,
                  borderRadius:    borderRadius.md,
                  cursor:          'pointer',
                  marginBottom:    spacing[0.5],
                  backgroundColor: isActive ? SB.active : 'transparent',
                  transition:      '100ms',
                  border:          isActive ? `1px solid ${colors.gray[700]}` : '1px solid transparent',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) (e.currentTarget as HTMLDivElement).style.backgroundColor = SB.hover;
                }}
                onMouseLeave={(e) => {
                  if (!isActive) (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
                }}
              >
                {/* Board name */}
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

                {/* Actions */}
                <div
                  style={{ display: 'flex', gap: spacing[0.5], marginLeft: spacing[2], opacity: isActive ? 1 : 0 }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLDivElement).style.opacity = '1'}
                  onMouseLeave={(e) => (e.currentTarget as HTMLDivElement).style.opacity = isActive ? '1' : '0'}
                >
                  <SbBtn
                    size="xs"
                    onClick={(e?: MouseEvent) => { e?.stopPropagation(); setEditingBoard(board); setIsEditOpen(true); }}
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
          })
        )}
      </div>
      )}

      {/* Footer hint */}
      {!sidebarCollapsed && (
      <div style={{
        padding:      `${spacing[3]} ${spacing[4]}`,
        borderTop:    `1px solid ${SB.border}`,
        flexShrink:   0,
      }}>
        <p style={{ fontSize: '11px', color: colors.gray[600], lineHeight: 1.5, margin: 0 }}>
          Space + drag to pan · Scroll to zoom
        </p>
      </div>
      )}

      {/* ── Modals (rendered in light style on white backdrop) ── */}

      {/* Create */}
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

      {/* Rename */}
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
            setEditingBoard(prev => prev ? { ...prev, name: e.target.value } : null)
          }
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleSaveEdit()}
          autoFocus
        />
      </StyledModal>

      {/* Delete confirm */}
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
    </div>
  );
};
