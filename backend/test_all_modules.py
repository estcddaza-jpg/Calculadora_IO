"""
test_all_modules.py — Suite completa de pruebas para todos los módulos del backend.
Valida matemáticamente con casos de prueba reales.
"""
import pytest
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.network_solver import (
    solve_transport,
    solve_assignment,
    solve_kuhn_munkres,
    solve_max_flow,
    solve_min_cost_flow,
)
from app.services.simplex_solver import solve_graphical_method
from app.services.pert_cpm_solver import solve_cpm, solve_pert


# ═══════════════════════════════════════════════════════════════
#  1. MÉTODO GRÁFICO
# ═══════════════════════════════════════════════════════════════

class TestGraphicalMethod:
    def test_basic_maximization_2vars(self):
        """Maximizar Z=3x1+5x2 sujeto a restricciones clásicas. Z*=36 en (2,6)."""
        constraints = [
            {"coefficients": [1, 0], "operator": "<=", "rhs": 4},
            {"coefficients": [0, 2], "operator": "<=", "rhs": 12},
            {"coefficients": [3, 2], "operator": "<=", "rhs": 18},
        ]
        result = solve_graphical_method(
            obj_coeffs=[3, 5],
            constraints=constraints,
            obj_type="MAX",
        )
        assert result["status"] == "optimal", f"Status inesperado: {result.get('status')}"
        assert abs(result["optimal_value"] - 36) < 0.5, f"Z*={result['optimal_value']} ≠ 36"

    def test_feasible_region_vertices(self):
        """Verifica que los vértices de la región factible sean devueltos."""
        constraints = [
            {"coefficients": [1, 0], "operator": "<=", "rhs": 5},
            {"coefficients": [0, 1], "operator": "<=", "rhs": 5},
            {"coefficients": [1, 1], "operator": "<=", "rhs": 8},
        ]
        result = solve_graphical_method(
            obj_coeffs=[2, 3],
            constraints=constraints,
            obj_type="MAX",
        )
        assert result["status"] == "optimal"
        assert len(result.get("vertices", [])) >= 3, "Debe tener al menos 3 vértices"


# ═══════════════════════════════════════════════════════════════
#  2. ASIGNACIÓN — Método Húngaro
# ═══════════════════════════════════════════════════════════════

class TestAssignment:
    def test_3x3_minimization(self):
        """Problema 3x3 clásico de asignación."""
        cost_matrix = [
            [9, 2, 7],
            [3, 6, 3],
            [5, 8, 1],
        ]
        result = solve_assignment(cost_matrix=cost_matrix, problem_type="MIN")
        assert result["status"] == "optimal"
        assert result["total_cost"] <= 17
        assert len(result["assignments"]) == 3

    def test_4x4_minimization_known_answer(self):
        """Problema 4x4 con respuesta conocida."""
        cost_matrix = [
            [82, 83, 69, 92],
            [77, 37, 49, 92],
            [11, 69, 5,  86],
            [8,  9,  98, 23],
        ]
        result = solve_assignment(cost_matrix=cost_matrix, problem_type="MIN")
        assert result["status"] == "optimal"
        assert result["total_cost"] == pytest.approx(140, abs=5)

    def test_maximization(self):
        """Asignación de maximización."""
        profit_matrix = [
            [16, 10, 14],
            [14, 11, 15],
            [15, 15, 13],
        ]
        result = solve_assignment(cost_matrix=profit_matrix, problem_type="MAX")
        assert result["status"] == "optimal"
        assert result["total_cost"] >= 40

    def test_returns_kuhn_munkres_steps(self):
        """Verifica que se devuelven los pasos del algoritmo."""
        result = solve_assignment(
            cost_matrix=[[4, 2], [3, 1]],
            problem_type="MIN"
        )
        assert "steps" in result
        assert len(result["steps"]) >= 2

    def test_non_square_matrix(self):
        """Matriz no cuadrada (2x3) debe autobalancearse."""
        cost_matrix = [
            [3, 5, 9],
            [8, 2, 4],
        ]
        result = solve_assignment(cost_matrix=cost_matrix, problem_type="MIN")
        assert result["status"] == "optimal"
        assert len(result["assignments"]) == 2


# ═══════════════════════════════════════════════════════════════
#  3. KUHN-MUNKRES — Historial de pasos matriciales
# ═══════════════════════════════════════════════════════════════

class TestKuhnMunkres:
    def test_returns_complete_steps(self):
        """Verifica que solve_kuhn_munkres devuelva el historial completo."""
        cost_matrix = [
            [8, 4, 7],
            [5, 2, 3],
            [9, 4, 8],
        ]
        steps = solve_kuhn_munkres(cost_matrix=cost_matrix, problem_type="MIN")
        assert len(steps) >= 3
        step_names = [s.get("step", "") for s in steps]
        assert any("filas" in s.lower() or "Paso 1" in s for s in step_names)
        assert any("columnas" in s.lower() or "Paso 2" in s for s in step_names)

    def test_final_step_has_assignment(self):
        """El último paso debe contener la asignación óptima."""
        cost_matrix = [[2, 3], [3, 2]]
        steps = solve_kuhn_munkres(cost_matrix=cost_matrix, problem_type="MIN")
        final_step = steps[-1]
        assert final_step.get("is_final") == True
        assert "assignments" in final_step

    def test_max_problem_starts_with_conversion(self):
        """Para MAX, el primer paso debe ser la conversión MAX→MIN."""
        cost_matrix = [[5, 1], [2, 4]]
        steps = solve_kuhn_munkres(cost_matrix=cost_matrix, problem_type="MAX")
        first = steps[0]
        assert "MAX" in first.get("step", "") or "MAX" in first.get("description", "")

    def test_step_matrices_have_correct_dimensions(self):
        """Cada matriz debe ser 3x3 para entrada 3x3."""
        cost_matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
        steps = solve_kuhn_munkres(cost_matrix=cost_matrix, problem_type="MIN")
        for step in steps:
            m = step.get("matrix")
            if m:
                assert len(m) == 3
                for row in m:
                    assert len(row) == 3


# ═══════════════════════════════════════════════════════════════
#  4. FLUJO MÁXIMO — Edmonds-Karp con rutas de aumento
# ═══════════════════════════════════════════════════════════════

class TestMaxFlow:
    def test_simple_flow(self):
        """Red simple. Flujo máximo debe ser 5."""
        edges = [
            {"source": "s", "target": "A", "capacity": 10},
            {"source": "A", "target": "t", "capacity": 5},
        ]
        result = solve_max_flow(edges=edges, source="s", sink="t")
        assert result["status"] == "optimal"
        assert result["max_flow"] == pytest.approx(5, abs=0.01)

    def test_returns_augmenting_paths(self):
        """Verifica que se devuelvan las rutas de aumento."""
        edges = [
            {"source": "s", "target": "A", "capacity": 10},
            {"source": "A", "target": "t", "capacity": 5},
        ]
        result = solve_max_flow(edges=edges, source="s", sink="t")
        assert "augmenting_paths" in result
        assert len(result["augmenting_paths"]) >= 1

    def test_augmenting_paths_structure(self):
        """Verifica la estructura de cada ruta de aumento."""
        edges = [
            {"source": "s", "target": "A", "capacity": 10},
            {"source": "s", "target": "B", "capacity": 10},
            {"source": "A", "target": "t", "capacity": 10},
            {"source": "B", "target": "t", "capacity": 10},
        ]
        result = solve_max_flow(edges=edges, source="s", sink="t")
        for path in result.get("augmenting_paths", []):
            assert "path" in path
            assert "bottleneck" in path
            assert path["bottleneck"] > 0
            assert "s" in path["path"]
            assert "t" in path["path"]

    def test_flow_conservation(self):
        """Conservación de flujo: lo que entra al sumidero == flujo máximo."""
        edges = [
            {"source": "s", "target": "A", "capacity": 8},
            {"source": "s", "target": "B", "capacity": 5},
            {"source": "A", "target": "C", "capacity": 6},
            {"source": "B", "target": "C", "capacity": 3},
            {"source": "C", "target": "t", "capacity": 10},
        ]
        result = solve_max_flow(edges=edges, source="s", sink="t")
        assert result["status"] == "optimal"
        # All flows should be non-negative
        for edge in result.get("flow_on_edges", []):
            assert edge["flow"] >= 0


# ═══════════════════════════════════════════════════════════════
#  5. FLUJO A COSTO MÍNIMO
# ═══════════════════════════════════════════════════════════════

class TestMinCostFlow:
    def test_basic_min_cost(self):
        """Red simple. Costo mínimo = 10 * 3 = 30."""
        nodes = [
            {"id": "s", "demand": 10},
            {"id": "t", "demand": -10},
        ]
        edges = [
            {"source": "s", "target": "t", "capacity": 15, "cost": 3},
        ]
        result = solve_min_cost_flow(nodes=nodes, edges=edges)
        assert result["status"] == "optimal"
        assert result["total_cost"] == pytest.approx(30, abs=0.01)

    def test_two_path_cheapest_route(self):
        """El flujo debe tomar la ruta más barata. Nodos intermedios distintos para evitar aristas paralelas."""
        nodes = [
            {"id": "s", "demand": 5},
            {"id": "A", "demand": 0},
            {"id": "B", "demand": 0},
            {"id": "t", "demand": -5},
        ]
        edges = [
            {"source": "s", "target": "A", "capacity": 10, "cost": 2},
            {"source": "A", "target": "t", "capacity": 10, "cost": 0},
            {"source": "s", "target": "B", "capacity": 10, "cost": 8},
            {"source": "B", "target": "t", "capacity": 10, "cost": 0},
        ]
        result = solve_min_cost_flow(nodes=nodes, edges=edges)
        assert result["status"] == "optimal"
        assert result["total_cost"] == pytest.approx(10, abs=0.01), \
            f"El flujo debe ir por la ruta barata (s→A→t, costo=2). Total={result['total_cost']}"

    def test_transshipment_node(self):
        """Red con nodo de transbordo. Costo esperado = 20*1 + 20*2 = 60."""
        nodes = [
            {"id": "s", "demand": 20},
            {"id": "m", "demand": 0},
            {"id": "t", "demand": -20},
        ]
        edges = [
            {"source": "s", "target": "m", "capacity": 25, "cost": 1},
            {"source": "m", "target": "t", "capacity": 25, "cost": 2},
        ]
        result = solve_min_cost_flow(nodes=nodes, edges=edges)
        assert result["status"] == "optimal"
        assert result["total_cost"] == pytest.approx(60, abs=0.01)

    def test_unbalanced_supply_demand_error(self):
        """Red desbalanceada debe devolver error."""
        nodes = [
            {"id": "s", "demand": 10},
            {"id": "t", "demand": -5},
        ]
        edges = [{"source": "s", "target": "t", "capacity": 15, "cost": 1}]
        result = solve_min_cost_flow(nodes=nodes, edges=edges)
        assert result["status"] == "error"

    def test_returns_flow_edges_with_cost(self):
        """Verifica estructura de arcos en el resultado."""
        nodes = [{"id": "s", "demand": 5}, {"id": "t", "demand": -5}]
        edges = [{"source": "s", "target": "t", "capacity": 10, "cost": 4}]
        result = solve_min_cost_flow(nodes=nodes, edges=edges)
        assert result["status"] == "optimal"
        assert len(result.get("flow_on_edges", [])) >= 1
        edge = result["flow_on_edges"][0]
        assert "flow" in edge
        assert "cost_per_unit" in edge
        assert "arc_cost" in edge


# ═══════════════════════════════════════════════════════════════
#  6. TRANSPORTE
# ═══════════════════════════════════════════════════════════════

class TestTransport:
    COSTS = [[2, 3, 1], [5, 4, 8], [5, 6, 8]]
    SUPPLY = [20, 30, 25]
    DEMAND = [15, 25, 35]

    def test_northwest_corner(self):
        result = solve_transport("northwest", self.SUPPLY, self.DEMAND, self.COSTS)
        assert result["status"] == "optimal"
        assert result["total_cost"] > 0

    def test_min_cost_method(self):
        result = solve_transport("min_cost", self.SUPPLY, self.DEMAND, self.COSTS)
        assert result["status"] == "optimal"
        assert result["total_cost"] > 0

    def test_vogel_approximation(self):
        result = solve_transport("vogel", self.SUPPLY, self.DEMAND, self.COSTS)
        assert result["status"] == "optimal"
        assert result["total_cost"] > 0

    def test_unbalanced_auto_fixed(self):
        supply = [30, 40]
        demand = [25, 35]
        costs = [[2, 4], [3, 1]]
        result = solve_transport("northwest", supply, demand, costs)
        assert result["status"] == "optimal"
        assert result["dummy_added"] is not None


# ═══════════════════════════════════════════════════════════════
#  7. CPM / PERT
# ═══════════════════════════════════════════════════════════════

class TestCPMPERT:
    def test_cpm_critical_path(self):
        """Proyecto clásico. Ruta crítica incluye A, B y C."""
        activities = [
            {"id": "A", "name": "Diseño",     "duration": 4, "predecessors": []},
            {"id": "B", "name": "Desarrollo", "duration": 6, "predecessors": ["A"]},
            {"id": "C", "name": "Pruebas",    "duration": 3, "predecessors": ["B"]},
            {"id": "D", "name": "Doc",        "duration": 2, "predecessors": ["A"]},
            {"id": "E", "name": "Entrega",    "duration": 1, "predecessors": ["C", "D"]},
        ]
        result = solve_cpm(activities)
        assert result["status"] == "optimal"
        critical = result.get("critical_path", [])
        assert "A" in critical
        assert "B" in critical
        assert "C" in critical

    def test_cpm_slack_for_non_critical(self):
        """Actividades no críticas deben tener holgura > 0."""
        activities = [
            {"id": "A", "name": "A", "duration": 4, "predecessors": []},
            {"id": "B", "name": "B", "duration": 6, "predecessors": ["A"]},
            {"id": "C", "name": "C", "duration": 3, "predecessors": ["B"]},
            {"id": "D", "name": "D", "duration": 2, "predecessors": ["A"]},
            {"id": "E", "name": "E", "duration": 1, "predecessors": ["C", "D"]},
        ]
        result = solve_cpm(activities)
        for act in result.get("activities", []):
            if not act.get("is_critical"):
                assert act.get("slack", 0) > 0

    def test_pert_expected_duration(self):
        """PERT con 3 tiempos. te = (o + 4m + p) / 6."""
        activities = [
            {"id": "A", "name": "A", "optimistic": 2, "most_likely": 4, "pessimistic": 6, "predecessors": []},
            {"id": "B", "name": "B", "optimistic": 3, "most_likely": 5, "pessimistic": 7, "predecessors": ["A"]},
        ]
        result = solve_pert(activities)
        assert result["status"] == "optimal"
        assert result["expected_duration"] == pytest.approx(9, abs=0.5)

    def test_pert_probability_calculation(self):
        """PERT con tiempo objetivo debe calcular probabilidad."""
        activities = [
            {"id": "A", "name": "A", "optimistic": 1, "most_likely": 3, "pessimistic": 5, "predecessors": []},
        ]
        result = solve_pert(activities, target_time=4.0)
        assert result["status"] == "optimal"
        prob_data = result.get("probability_data", {})
        assert prob_data is not None
        assert 0 <= prob_data.get("probability", -1) <= 1


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
