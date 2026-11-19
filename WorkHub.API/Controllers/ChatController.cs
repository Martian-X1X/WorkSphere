using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkHub.Application.DTOs.Chat;
using WorkHub.Application.DTOs.Common;
using WorkHub.Application.Interfaces;

namespace WorkHub.API.Controllers;

[ApiController]
[Route("api/chat")]
[Produces("application/json")]
[Authorize]
public class ChatController : ControllerBase
{
    private readonly IChatService _chatService;
    private readonly ICurrentUserService _currentUser;

    public ChatController(
        IChatService chatService,
        ICurrentUserService currentUser)
    {
        _chatService = chatService;
        _currentUser = currentUser;
    }

    [HttpGet("rooms")]
    [ProducesResponseType(typeof(ApiResponse<List<ChatRoomDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyRooms()
    {
        var rooms = await _chatService.GetMyRoomsAsync(
            _currentUser.UserId,
            _currentUser.OrganizationId);

        return Ok(ApiResponse<List<ChatRoomDto>>.Ok(rooms));
    }

    [HttpPost("rooms")]
    [ProducesResponseType(typeof(ApiResponse<ChatRoomDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateRoom([FromBody] CreateRoomDto dto)
    {
        var room = await _chatService.CreateRoomAsync(
            dto,
            _currentUser.UserId,
            _currentUser.OrganizationId);

        return CreatedAtAction(
            nameof(GetRoom),
            new { roomId = room.Id },
            ApiResponse<ChatRoomDto>.Ok(room, "Room created."));
    }

    [HttpGet("rooms/{roomId:guid}")]
    [ProducesResponseType(typeof(ApiResponse<ChatRoomDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetRoom(Guid roomId)
    {
        var room = await _chatService.GetRoomAsync(
            roomId,
            _currentUser.UserId,
            _currentUser.OrganizationId);

        return Ok(ApiResponse<ChatRoomDto>.Ok(room));
    }

    [HttpPost("dm/{targetUserId:guid}")]
    [ProducesResponseType(typeof(ApiResponse<ChatRoomDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetOrCreateDm(Guid targetUserId)
    {
        if (targetUserId == _currentUser.UserId)
            return BadRequest(ApiResponse.Fail("Cannot DM yourself."));

        var room = await _chatService.GetOrCreateDmAsync(
            targetUserId,
            _currentUser.UserId,
            _currentUser.OrganizationId);

        return Ok(ApiResponse<ChatRoomDto>.Ok(room));
    }

    [HttpGet("rooms/{roomId:guid}/messages")]
    [ProducesResponseType(typeof(ApiResponse<MessagePageDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetMessages(
        Guid roomId,
        [FromQuery] string? cursor = null,
        [FromQuery] int pageSize = 30)
    {
        var page = await _chatService.GetMessagesAsync(
            roomId,
            _currentUser.UserId,
            _currentUser.OrganizationId,
            cursor,
            pageSize);

        return Ok(ApiResponse<MessagePageDto>.Ok(page));
    }

    [HttpPost("rooms/{roomId:guid}/messages")]
    [ProducesResponseType(typeof(ApiResponse<MessageDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SendMessage(
        Guid roomId,
        [FromBody] SendMessageDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Content))
            return BadRequest(ApiResponse.Fail("Message content is required."));

        if (dto.Content.Length > 4000)
            return BadRequest(ApiResponse.Fail("Message too long (max 4000 chars)."));

        var message = await _chatService.SendMessageAsync(
            roomId,
            dto,
            _currentUser.UserId,
            _currentUser.OrganizationId);

        return Ok(ApiResponse<MessageDto>.Ok(message, "Message sent."));
    }

    [HttpPatch("rooms/{roomId:guid}/messages/{messageId:guid}")]
    [ProducesResponseType(typeof(ApiResponse<MessageDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> EditMessage(
        Guid roomId,
        Guid messageId,
        [FromBody] EditMessageDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Content))
            return BadRequest(ApiResponse.Fail("Content is required."));

        var message = await _chatService.EditMessageAsync(
            roomId,
            messageId,
            dto,
            _currentUser.UserId,
            _currentUser.OrganizationId);

        return Ok(ApiResponse<MessageDto>.Ok(message, "Message updated."));
    }

    [HttpDelete("rooms/{roomId:guid}/messages/{messageId:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> DeleteMessage(Guid roomId, Guid messageId)
    {
        await _chatService.DeleteMessageAsync(
            roomId,
            messageId,
            _currentUser.UserId,
            _currentUser.OrganizationId);

        return Ok(ApiResponse.Ok("Message deleted."));
    }

    [HttpPost("rooms/{roomId:guid}/messages/{messageId:guid}/reactions")]
    [ProducesResponseType(typeof(ApiResponse<ReactionGroupDto?>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ToggleReaction(
        Guid roomId,
        Guid messageId,
        [FromBody] ToggleReactionDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Emoji))
            return BadRequest(ApiResponse.Fail("Emoji is required."));

        var group = await _chatService.ToggleReactionAsync(
            roomId,
            messageId,
            dto,
            _currentUser.UserId,
            _currentUser.OrganizationId);

        return Ok(ApiResponse<ReactionGroupDto?>.Ok(group));
    }

    [HttpGet("rooms/{roomId:guid}/members")]
    [ProducesResponseType(typeof(ApiResponse<List<ChatRoomMemberDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMembers(Guid roomId)
    {
        var members = await _chatService.GetMembersAsync(
            roomId,
            _currentUser.UserId,
            _currentUser.OrganizationId);

        return Ok(ApiResponse<List<ChatRoomMemberDto>>.Ok(members));
    }

    [HttpPost("rooms/{roomId:guid}/members")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> AddMembers(
        Guid roomId,
        [FromBody] AddMemberDto dto)
    {
        await _chatService.AddMembersAsync(
            roomId,
            dto,
            _currentUser.UserId,
            _currentUser.OrganizationId);

        return Ok(ApiResponse.Ok("Members added."));
    }

    [HttpDelete("rooms/{roomId:guid}/members/{userId:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> RemoveMember(Guid roomId, Guid userId)
    {
        await _chatService.RemoveMemberAsync(
            roomId,
            userId,
            _currentUser.UserId,
            _currentUser.OrganizationId);

        return Ok(ApiResponse.Ok("Member removed."));
    }

    [HttpPatch("rooms/{roomId:guid}/read")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> MarkRead(Guid roomId)
    {
        await _chatService.MarkRoomReadAsync(
            roomId,
            _currentUser.UserId,
            _currentUser.OrganizationId);

        return Ok(ApiResponse.Ok("Marked as read."));
    }
}
