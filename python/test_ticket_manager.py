from ticket_manager import Ticket, TicketManager


def test_creation_ticket():
    ticket = Ticket(
        title="Serveur DNS",
        description="Les clients ne résolvent plus les noms internes.",
        priority="Haute",
        category="Réseau",
        status="Ouvert",
    )
    assert ticket.ticket_id.startswith("T-")
    assert ticket.status == "Ouvert"


def test_validation_ticket():
    manager = TicketManager()
    try:
        manager.add_ticket(Ticket(title="", description="Erreur", priority="Faible", category="Réseau", status="Ouvert"))
        assert False, "Une erreur devait être levée"
    except ValueError as exc:
        assert "titre" in str(exc).lower()


def test_recherche_et_fermeture():
    manager = TicketManager([
        Ticket(title="DNS interne", description="Problème de résolution", priority="Haute", category="Réseau", status="Ouvert"),
        Ticket(title="Imprimante", description="Selon un bac", priority="Faible", category="Matériel", status="Fermé"),
    ])
    result = manager.list_tickets(query="dns", priority="Haute")
    assert len(result) == 1
    closed = manager.close_ticket(result[0].ticket_id)
    assert closed.status == "Fermé"


def test_export_csv():
    manager = TicketManager([
        Ticket(title="AD", description="Accès refusé", priority="Moyenne", category="Active Directory", status="En cours"),
    ])
    csv_data = manager.export_csv()
    assert "id,titre,description,priorite,statut,categorie,date" in csv_data
    assert "AD" in csv_data
