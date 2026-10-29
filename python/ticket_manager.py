from __future__ import annotations

from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
import csv
import io
from typing import Iterable, List, Optional

VALID_PRIORITIES = {"Faible", "Moyenne", "Haute", "Critique"}
VALID_STATUSES = {"Ouvert", "En cours", "Fermé"}


@dataclass
class Ticket:
    title: str
    description: str
    priority: str = "Moyenne"
    category: str = "Général"
    status: str = "Ouvert"
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat(timespec="seconds"))
    ticket_id: str = ""

    def __post_init__(self) -> None:
        self.title = self.title.strip()
        self.description = self.description.strip()
        self.priority = self.priority.strip() or "Moyenne"
        self.category = self.category.strip() or "Général"
        self.status = self.status.strip() or "Ouvert"
        if not self.ticket_id:
            self.ticket_id = f"T-{int(datetime.now(timezone.utc).timestamp() * 1000)}"

    def to_dict(self) -> dict:
        return asdict(self)


class TicketManager:
    def __init__(self, tickets: Optional[Iterable[Ticket]] = None) -> None:
        self.tickets: List[Ticket] = list(tickets or [])

    def add_ticket(self, ticket: Ticket) -> Ticket:
        self.validate_ticket(ticket)
        self.tickets.append(ticket)
        return ticket

    def list_tickets(self, *, query: str = "", priority: Optional[str] = None, status: Optional[str] = None) -> List[Ticket]:
        q = query.strip().lower()
        result = []
        for ticket in self.tickets:
            text = f"{ticket.title} {ticket.description} {ticket.category}".lower()
            matches_query = not q or q in text
            matches_priority = not priority or ticket.priority == priority
            matches_status = not status or ticket.status == status
            if matches_query and matches_priority and matches_status:
                result.append(ticket)
        return result

    def close_ticket(self, ticket_id: str) -> Ticket:
        for ticket in self.tickets:
            if ticket.ticket_id == ticket_id:
                ticket.status = "Fermé"
                return ticket
        raise ValueError(f"Ticket {ticket_id} introuvable.")

    def export_csv(self) -> str:
        buffer = io.StringIO()
        writer = csv.writer(buffer)
        writer.writerow(["id", "titre", "description", "priorite", "statut", "categorie", "date"])
        for ticket in self.tickets:
            writer.writerow([
                ticket.ticket_id,
                ticket.title,
                ticket.description,
                ticket.priority,
                ticket.status,
                ticket.category,
                ticket.created_at,
            ])
        return buffer.getvalue()

    @staticmethod
    def validate_ticket(ticket: Ticket) -> None:
        if not ticket.title:
            raise ValueError("Le titre est obligatoire.")
        if not ticket.description:
            raise ValueError("La description est obligatoire.")
        if ticket.priority not in VALID_PRIORITIES:
            raise ValueError("La priorité doit être Faible, Moyenne, Haute ou Critique.")
        if ticket.status not in VALID_STATUSES:
            raise ValueError("Le statut doit être Ouvert, En cours ou Fermé.")
        if not ticket.category:
            raise ValueError("La catégorie est obligatoire.")


if __name__ == "__main__":
    manager = TicketManager()
    manager.add_ticket(Ticket(
        title="Poste bloqué",
        description="L’utilisateur ne peut plus ouvrir Outlook.",
        priority="Haute",
        category="Matériel",
        status="Ouvert",
    ))
    print(manager.list_tickets())
    print(manager.export_csv())
