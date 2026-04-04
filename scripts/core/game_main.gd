extends Node2D

@onready var hud = $Hud
@onready var player = $Player

func _ready() -> void:
	# Passa il nodo player all'HUD
	hud.player = player