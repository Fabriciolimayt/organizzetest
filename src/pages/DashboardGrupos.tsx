import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Home, Mail, Plus, ShieldCheck, Trash2, UserRound, Users } from "lucide-react";
import { Link } from "react-router-dom";

import DashboardCard from "@/components/dashboard/DashboardCard";
import EmptyState from "@/components/dashboard/EmptyState";
import PageHeader from "@/components/dashboard/PageHeader";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useFinancialContext } from "@/hooks/useFinancialContext";
import { useSubscriptionV2 } from "@/hooks/useSubscriptionV2";
import {
  useCreateSpaceInvitationV2,
  useCreateSpaceV2,
  useRevokeSpaceInvitationV2,
  useSpaceInvitationsV2,
  useSpaceMembersV2,
  useSpacesV2,
  useUpdateSpaceMemberRoleV2,
} from "@/hooks/useSpacesV2";
import { canManageHousehold, effectiveInvitationStatus, type InvitationRole, type MemberRole } from "@/lib/finance/invitations";
import type { V2Row } from "@/integrations/supabase/v2";
import { capabilitiesForSubscription } from "@/lib/finance/capabilities";

type Invitation = Omit<V2Row<"space_invitations">, "token_hash">;

const roleLabels: Record<MemberRole, string> = {
  owner: "Proprietário",
  admin: "Administrador",
  member: "Membro",
  viewer: "Consulta",
};

const invitationStatusLabels: Record<Invitation["status"], string> = {
  pending: "Pendente",
  accepted: "Aceite",
  declined: "Recusado",
  expired: "Expirado",
  revoked: "Revogado",
};

const memberInitials = (userId: string, isCurrentUser: boolean) =>
  isCurrentUser ? "EU" : userId.replace(/-/g, "").slice(0, 2).toUpperCase();

const DashboardGrupos = () => {
  const { user } = useAuth();
  const financial = useFinancialContext();
  const subscription = useSubscriptionV2();
  const { toast } = useToast();
  const spacesQuery = useSpacesV2();
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>();
  const [spaceDialogOpen, setSpaceDialogOpen] = useState(false);
  const [spaceName, setSpaceName] = useState("");
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<InvitationRole>("member");
  const [latestInvitationLink, setLatestInvitationLink] = useState("");
  const [invitationToRevoke, setInvitationToRevoke] = useState<Invitation | null>(null);

  const spaces = useMemo(() => spacesQuery.data ?? [], [spacesQuery.data]);
  const capabilities = capabilitiesForSubscription(subscription.data);
  const familyLimitReached = !capabilities.unlimitedGroups && spaces.some((space) => space.kind === "family");
  const selectedSpace = spaces.find((space) => space.id === selectedSpaceId) ?? spaces[0];
  const canManage = canManageHousehold(selectedSpace?.role);
  const membersQuery = useSpaceMembersV2(selectedSpace?.id);
  const invitationsQuery = useSpaceInvitationsV2(selectedSpace?.id, canManage);
  const createSpace = useCreateSpaceV2();
  const createInvitation = useCreateSpaceInvitationV2();
  const revokeInvitation = useRevokeSpaceInvitationV2();
  const updateRole = useUpdateSpaceMemberRoleV2();

  useEffect(() => {
    if (!spaces.length) {
      setSelectedSpaceId(undefined);
      return;
    }
    if (!selectedSpaceId || !spaces.some((space) => space.id === selectedSpaceId)) {
      setSelectedSpaceId(financial.data?.spaceId ?? spaces[0].id);
    }
  }, [financial.data?.spaceId, selectedSpaceId, spaces]);

  const showError = (title: string, reason: unknown) => {
    toast({
      title,
      description: reason instanceof Error ? reason.message : "Não foi possível concluir a operação.",
      variant: "destructive",
    });
  };

  const submitSpace = (event: React.FormEvent) => {
    event.preventDefault();
    if (familyLimitReached) return;
    createSpace.mutate({ name: spaceName }, {
      onSuccess: (space) => {
        setSpaceDialogOpen(false);
        setSpaceName("");
        setSelectedSpaceId(space.id);
        financial.selectSpace(space.id);
        toast({ title: "Espaço familiar criado" });
      },
      onError: (reason) => showError("Não foi possível criar o espaço", reason),
    });
  };

  const submitInvitation = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedSpace) return;
    createInvitation.mutate({
      spaceId: selectedSpace.id,
      email: inviteEmail,
      role: inviteRole,
    }, {
      onSuccess: ({ path }) => {
        setLatestInvitationLink(`${window.location.origin}${path}`);
        setInviteEmail("");
        toast({ title: "Convite criado", description: "Partilha o link com a pessoa convidada." });
      },
      onError: (reason) => showError("Não foi possível criar o convite", reason),
    });
  };

  const copyInvitationLink = async () => {
    try {
      await navigator.clipboard.writeText(latestInvitationLink);
      toast({ title: "Link copiado" });
    } catch {
      toast({ title: "Não foi possível copiar", description: "Seleciona o link e copia-o manualmente.", variant: "destructive" });
    }
  };

  if (spacesQuery.isLoading) {
    return <DashboardCard><p className="py-10 text-center text-sm text-muted-foreground">A carregar espaços familiares...</p></DashboardCard>;
  }

  if (spacesQuery.isError) {
    return (
      <DashboardCard>
        <EmptyState
          icon={<Users size={48} />}
          message="Não foi possível carregar os teus espaços."
          action={<Button variant="outline" onClick={() => void spacesQuery.refetch()}>Tentar novamente</Button>}
        />
      </DashboardCard>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Partilhar e automatizar" title="Espaços partilhados" description="Gere quem participa nos teus orçamentos pessoais e familiares." actions={familyLimitReached ? <Button asChild variant="outline"><Link to="/dashboard/assinatura">Desbloquear mais espaços</Link></Button> : <Button className="gap-2" onClick={() => setSpaceDialogOpen(true)}><Plus size={16} /> Novo espaço</Button>} />

      {!selectedSpace ? (
        <DashboardCard>
          <EmptyState
            icon={<Home size={48} />}
            message="Ainda não tens nenhum espaço financeiro disponível."
            action={<Button onClick={() => setSpaceDialogOpen(true)}>Criar espaço familiar</Button>}
          />
        </DashboardCard>
      ) : (
        <>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Label htmlFor="space-selector" className="shrink-0 text-sm">Espaço ativo</Label>
            <Select value={selectedSpace.id} onValueChange={(value) => {
              setSelectedSpaceId(value);
              financial.selectSpace(value);
              setLatestInvitationLink("");
            }}>
              <SelectTrigger id="space-selector" className="w-full sm:w-72">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {spaces.map((space) => (
                  <SelectItem key={space.id} value={space.id}>
                    {space.name} · {roleLabels[space.role]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DashboardCard>
            <div className="space-y-5">
              <div className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {selectedSpace.kind === "family" ? <Users size={21} /> : <Home size={21} />}
                  </div>
                  <div>
                    <h3 className="font-semibold">{selectedSpace.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {selectedSpace.kind === "family" ? "Espaço familiar" : "Espaço pessoal"} · {roleLabels[selectedSpace.role]}
                    </p>
                  </div>
                </div>
                {canManage && (
                  <Button variant="outline" className="gap-2" onClick={() => {
                    setLatestInvitationLink("");
                    setInviteDialogOpen(true);
                  }}>
                    <Mail size={16} /> Convidar pessoa
                  </Button>
                )}
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-sm font-semibold">Membros</h4>
                  <span className="text-xs text-muted-foreground">{membersQuery.data?.length ?? 0} no total</span>
                </div>
                {membersQuery.isLoading ? (
                  <p className="py-6 text-sm text-muted-foreground">A carregar membros...</p>
                ) : membersQuery.isError ? (
                  <div className="flex items-center justify-between gap-3 py-4">
                    <p className="text-sm text-destructive">Não foi possível carregar os membros.</p>
                    <Button size="sm" variant="outline" onClick={() => void membersQuery.refetch()}>Tentar novamente</Button>
                  </div>
                ) : (
                  <div className="divide-y divide-border rounded-lg border border-border">
                    {(membersQuery.data ?? []).map((member) => {
                      const isCurrentUser = member.user_id === user?.id;
                      const editable = canManage && member.role !== "owner";
                      return (
                        <div key={member.id} className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                              {memberInitials(member.user_id, isCurrentUser)}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{isCurrentUser ? "Você" : member.display_name || `Membro ${member.user_id.slice(0, 8)}`}</p>
                              <p className="text-xs text-muted-foreground">Desde {new Intl.DateTimeFormat("pt-PT", { dateStyle: "medium" }).format(new Date(member.joined_at))}</p>
                            </div>
                          </div>
                          {editable ? (
                            <Select
                              value={member.role}
                              disabled={updateRole.isPending}
                              onValueChange={(role: InvitationRole) => updateRole.mutate({
                                spaceId: selectedSpace.id,
                                memberId: member.id,
                                currentRole: member.role,
                                role,
                              }, {
                                onSuccess: () => toast({ title: "Função atualizada" }),
                                onError: (reason) => showError("Não foi possível atualizar a função", reason),
                              })}
                            >
                              <SelectTrigger className="w-full sm:w-44" aria-label={`Função de ${isCurrentUser ? "Você" : member.user_id}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Administrador</SelectItem>
                                <SelectItem value="member">Membro</SelectItem>
                                <SelectItem value="viewer">Consulta</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge variant="secondary" className="w-fit gap-1.5">
                              {member.role === "owner" && <ShieldCheck size={13} />}{roleLabels[member.role]}
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </DashboardCard>

          {canManage && (
            <DashboardCard title="Convites">
              {invitationsQuery.isLoading ? (
                <p className="py-4 text-sm text-muted-foreground">A carregar convites...</p>
              ) : invitationsQuery.isError ? (
                <div className="flex items-center justify-between gap-3 py-3">
                  <p className="text-sm text-destructive">Não foi possível carregar os convites.</p>
                  <Button size="sm" variant="outline" onClick={() => void invitationsQuery.refetch()}>Tentar novamente</Button>
                </div>
              ) : (invitationsQuery.data ?? []).length === 0 ? (
                <EmptyState icon={<Mail size={42} />} message="Ainda não existem convites neste espaço." />
              ) : (
                <div className="divide-y divide-border">
                  {(invitationsQuery.data ?? []).map((invitation) => {
                    const status = effectiveInvitationStatus(invitation);
                    return (
                    <div key={invitation.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{invitation.email}</p>
                        <p className="text-xs text-muted-foreground">
                          {roleLabels[invitation.role]} · expira em {new Intl.DateTimeFormat("pt-PT", { dateStyle: "medium" }).format(new Date(invitation.expires_at))}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={status === "pending" ? "default" : "secondary"}>
                          {invitationStatusLabels[status]}
                        </Badge>
                        {status === "pending" && (
                          <Button
                            size="icon"
                            variant="ghost"
                            title="Revogar convite"
                            aria-label={`Revogar convite de ${invitation.email}`}
                            onClick={() => setInvitationToRevoke(invitation)}
                          >
                            <Trash2 size={16} className="text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </DashboardCard>
          )}
        </>
      )}

      <Dialog open={spaceDialogOpen} onOpenChange={setSpaceDialogOpen}>
        <DialogContent>
          <form onSubmit={submitSpace} className="space-y-5">
            <DialogHeader>
              <DialogTitle>Novo espaço familiar</DialogTitle>
              <DialogDescription>Cria um orçamento separado para partilhar com outras pessoas.</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="space-name">Nome</Label>
              <Input id="space-name" value={spaceName} onChange={(event) => setSpaceName(event.target.value)} placeholder="Ex.: Casa" maxLength={80} autoFocus />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSpaceDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={createSpace.isPending}>{createSpace.isPending ? "A criar..." : "Criar espaço"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={inviteDialogOpen} onOpenChange={(open) => {
        setInviteDialogOpen(open);
        if (!open) setLatestInvitationLink("");
      }}>
        <DialogContent>
          <form onSubmit={submitInvitation} className="space-y-5">
            <DialogHeader>
              <DialogTitle>Convidar para {selectedSpace?.name}</DialogTitle>
              <DialogDescription>O link só funcionará para a conta associada ao e-mail indicado.</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="invitation-email">E-mail</Label>
              <Input id="invitation-email" type="email" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="pessoa@exemplo.com" autoComplete="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invitation-role">Função</Label>
              <Select value={inviteRole} onValueChange={(value: InvitationRole) => setInviteRole(value)}>
                <SelectTrigger id="invitation-role"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="member">Membro</SelectItem>
                  <SelectItem value="viewer">Consulta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {latestInvitationLink && (
              <div className="space-y-2 rounded-lg border border-primary/25 bg-primary/5 p-3">
                <div className="flex items-center gap-2 text-sm font-medium text-primary"><Check size={15} /> Link pronto para partilhar</div>
                <div className="flex gap-2">
                  <Input readOnly value={latestInvitationLink} aria-label="Link do convite" />
                  <Button type="button" size="icon" variant="outline" title="Copiar link" aria-label="Copiar link" onClick={() => void copyInvitationLink()}>
                    <Copy size={16} />
                  </Button>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setInviteDialogOpen(false)}>Fechar</Button>
              <Button type="submit" disabled={createInvitation.isPending} className="gap-2">
                <UserRound size={16} /> {createInvitation.isPending ? "A criar..." : "Criar convite"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(invitationToRevoke)} onOpenChange={(open) => !open && setInvitationToRevoke(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revogar este convite?</AlertDialogTitle>
            <AlertDialogDescription>O link deixa de poder ser aceite. Esta ação não remove membros existentes.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revokeInvitation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={revokeInvitation.isPending}
              onClick={(event) => {
                event.preventDefault();
                if (!selectedSpace || !invitationToRevoke) return;
                revokeInvitation.mutate({ spaceId: selectedSpace.id, invitationId: invitationToRevoke.id }, {
                  onSuccess: () => {
                    setInvitationToRevoke(null);
                    toast({ title: "Convite revogado" });
                  },
                  onError: (reason) => showError("Não foi possível revogar o convite", reason),
                });
              }}
            >
              {revokeInvitation.isPending ? "A revogar..." : "Revogar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DashboardGrupos;
