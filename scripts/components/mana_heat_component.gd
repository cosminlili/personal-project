extends Node

@export var max_mana: float = 100.0
@export var mana_regen_per_second: float = 8.0

@export var max_heat: float = 100.0
@export var heat_decay_per_second: float = 6.0

var current_mana: float
var current_heat: float


func _ready() -> void:
	current_mana = max_mana
	current_heat = 0.0


func _process(delta: float) -> void:
	regenerate_mana(delta)
	reduce_heat(delta)


func regenerate_mana(delta: float) -> void:
	current_mana += mana_regen_per_second * delta
	current_mana = clamp(current_mana, 0.0, max_mana)


func reduce_heat(delta: float) -> void:
	current_heat -= heat_decay_per_second * delta
	current_heat = clamp(current_heat, 0.0, max_heat)


func has_enough_mana(amount: float) -> bool:
	return current_mana >= amount


func spend_mana(amount: float) -> bool:
	if not has_enough_mana(amount):
		return false
	
	current_mana -= amount
	current_mana = clamp(current_mana, 0.0, max_mana)
	return true


func add_heat(amount: float) -> void:
	current_heat += amount
	current_heat = clamp(current_heat, 0.0, max_heat)


func can_cast(mana_cost: float) -> bool:
	return has_enough_mana(mana_cost)


func use_skill(mana_cost: float, heat_gain: float) -> bool:
	if not can_cast(mana_cost):
		return false
	
	spend_mana(mana_cost)
	add_heat(heat_gain)
	return true