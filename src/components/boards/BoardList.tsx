// src/components/boards/BoardList.tsx
import React, { useState } from 'react';
import type { ChangeEvent, KeyboardEvent, MouseEvent } from 'react';
import { spacing, layout, colors, borderRadius } from '../../styles/design-system';
import { StyledModal, StyledInput, StyledButton } from '../ui/StyledComponents';
import { useBoardStore } from '../../store/boardStore';
import { BOARD_TEMPLATES } from '../../constants/boardTemplates';
import { TemplatePreview } from './TemplatePreview';

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
    width:           SB.width,
    minWidth:        SB.width,
    backgroundColor: SB.bg,
    borderRight:     `1px solid ${SB.border}`,
    display:         'flex',
    flexDirection:   'column',
    overflow:        'hidden',
  };

  return (
    <div style={sidebarStyle}>
      {/* Header */}
      <div style={{
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'space-between',
        padding:         `${spacing[4]} ${spacing[4]}`,
        borderBottom:    `1px solid ${SB.border}`,
        flexShrink:      0,
      }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: SB.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
          Boards
        </span>
        <SbBtn variant="primary" size="sm" onClick={() => setIsCreateOpen(true)} title="Create new board">
          + New
        </SbBtn>
      </div>

      {/* Board list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: spacing[2] }}>
        {boards.length === 0 ? (
          <div style={{ padding: `${spacing[8]} ${spacing[3]}`, textAlign: 'center' }}>
            <div style={{
              fontSize: '28px',
              marginBottom: spacing[3],
              opacity: 0.4,
            }}>
              📋
            </div>
            <p style={{ fontSize: '12px', color: SB.textMuted, marginBottom: spacing[4], lineHeight: 1.6 }}>
              No boards yet.<br />Create one to get started.
            </p>
            <SbBtn variant="primary" onClick={() => setIsCreateOpen(true)}>
              + Create board
            </SbBtn>
          </div>
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
                    ✎
                  </SbBtn>
                  <SbBtn
                    size="xs"
                    variant="danger"
                    onClick={(e?: MouseEvent) => { e?.stopPropagation(); setDeletingBoard(board.id); setIsDeleteOpen(true); }}
                    title="Delete board"
                  >
                    ✕
                  </SbBtn>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer hint */}
      <div style={{
        padding:      `${spacing[3]} ${spacing[4]}`,
        borderTop:    `1px solid ${SB.border}`,
        flexShrink:   0,
      }}>
        <p style={{ fontSize: '11px', color: colors.gray[600], lineHeight: 1.5, margin: 0 }}>
          Space + drag to pan · Scroll to zoom
        </p>
      </div>

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
