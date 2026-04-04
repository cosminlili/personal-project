extends CanvasLayer

@onready var mana_label = $ManaLabel
@onready var heat_label = $HeatLabel

@export var player: CharacterBody2D

func _process(_delta: float) -> void:
	# Assicurati di avere il componente ManaHeatComponent nel player
	var mana = int(player.get_node("ManaHeatComponent").current_mana)
	var heat = int(player.get_node("ManaHeatComponent").current_heat)
	
	# Aggiorna i testi delle Labels
	mana_label.text = "Mana: " + str(mana)
	heat_label.text = "Heat: " + str(heat)